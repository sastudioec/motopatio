import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  confirmTransaction,
  querySaleByClientTxId,
  mapPayphoneStatus,
  type PayPhoneConfirmResponse,
} from '@/lib/payphone'
import { activatePayment } from '@/lib/payments/activate'
import { handleRejectedPayment } from '@/lib/payments/reject'
import { notifyAdmin } from '@/lib/emails'

function getBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!url) return 'https://motopatio.com'
  return url.replace(/\/$/, '')
}

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(getBaseUrl() + path)
}

type PaymentForType = { concept: string; metadata: unknown }

function resolveType(payment: PaymentForType): 'plan' | 'featured' | 'upgrade' {
  if (payment.concept === 'featured') return 'featured'
  if (payment.concept === 'plan') {
    const md = payment.metadata as Record<string, unknown> | null
    if (md && md.isUpgrade === true) return 'upgrade'
  }
  return 'plan'
}

function typeSuffix(payment: PaymentForType): string {
  const t = resolveType(payment)
  return t === 'plan' ? '' : '&type=' + t
}

async function buildOkRedirect(
  payment: PaymentForType & { id: string },
  listingId: string | null
): Promise<NextResponse> {
  let suffix = listingId ? '&listingId=' + listingId : ''
  const t = resolveType(payment)
  if (t === 'featured') {
    suffix += '&type=featured'
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { destacadoHasta: true },
      })
      if (listing?.destacadoHasta) {
        suffix += '&destacadoHasta=' + encodeURIComponent(listing.destacadoHasta.toISOString())
      }
    }
  } else if (t === 'upgrade') {
    suffix += '&type=upgrade'
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { planTipo: true },
      })
      if (listing?.planTipo) {
        suffix += '&plan=' + encodeURIComponent(listing.planTipo)
      }
    }
  }
  return redirectTo('/pago/resultado?status=ok&paymentId=' + payment.id + suffix)
}

/**
 * PayPhone redirige aqui (GET) tras el pago con:
 *   ?id=<number>&clientTransactionId=<string>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const clientTxId = searchParams.get('clientTransactionId')

  if (!id || !clientTxId) {
    return redirectTo('/pago/resultado?status=error&reason=params')
  }

  const payment = await prisma.payment.findUnique({
    where: { clientTransactionId: clientTxId },
  })

  if (!payment) {
    return redirectTo('/pago/resultado?status=error&reason=notfound')
  }

  // Idempotencia: si ya fue aprobado, activate es idempotente (either activa
  // o devuelve already_active). Sirve como fallback si el reconciliador
  // aprobo el pago antes de que el usuario regrese.
  if (payment.status === 'approved') {
    const result = await activatePayment(payment.id)
    const listingId =
      result.status === 'activated' || result.status === 'already_active'
        ? result.listingId
        : null
    return buildOkRedirect(payment, listingId)
  }

  // Confirmar contra PayPhone
  let ppResponse: PayPhoneConfirmResponse
  try {
    ppResponse = await confirmTransaction({ id: parseInt(id), clientTxId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'error',
        errorMessage: msg,
        payphoneTransactionId: String(id),
      },
    })
    console.error('PayPhone confirm error:', msg)
    return redirectTo('/pago/resultado?status=error&reason=confirm&paymentId=' + payment.id + typeSuffix(payment))
  }

  // Persistimos SIEMPRE la respuesta cruda real (sea HTML, JSON, o
  // NeedsVerification con rawHtmlBody) — antes se fabricaba un JSON
  // local y se perdia el body real.
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      payphoneRawResponse: JSON.stringify(ppResponse),
      payphoneTransactionId: String(ppResponse.transactionId || id),
    },
  })

  let { paymentStatus, reason } = mapPayphoneStatus(ppResponse)

  // Si Confirm devolvio HTML/no-JSON (NeedsVerification -> 'unknown'),
  // NO confiamos en esa respuesta. Consultamos el read-only Sale/client/
  // que devuelve JSON estructurado y usamos ESO como fuente de verdad.
  if (paymentStatus === 'unknown') {
    console.log('[confirmar] Confirm devolvio NeedsVerification, consultando Sale/client/. clientTxId=' + clientTxId)
    let saleResponse: PayPhoneConfirmResponse | null = null
    try {
      saleResponse = await querySaleByClientTxId(clientTxId)
    } catch (e) {
      console.error('[confirmar] Sale/client failed:', e instanceof Error ? e.message : e)
    }

    if (saleResponse) {
      const remap = mapPayphoneStatus(saleResponse)
      paymentStatus = remap.paymentStatus
      reason = remap.reason
      // Reemplazar rawResponse con el read-only confiable. Preservamos
      // el confirm anterior (con su rawHtmlBody) para auditoria.
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          payphoneRawResponse: JSON.stringify({
            confirmFailed: ppResponse,
            saleClient: saleResponse,
          }),
          payphoneTransactionId: String(saleResponse.transactionId || ppResponse.transactionId || id),
        },
      })
      console.log('[confirmar] Sale/client confirmo paymentStatus=' + paymentStatus + ' reason=' + (reason || '-'))
    }
    // Si saleResponse tambien fallo, paymentStatus se queda 'unknown' y
    // el reconciliador (cron 5min) lo cierra mas tarde.
  }

  if (paymentStatus === 'pending' || paymentStatus === 'unknown') {
    // No tocamos status (sigue pending). En la UI mostramos un mensaje
    // distinto segun reason (pending = PayPhone aun no decide, unknown =
    // perdimos contacto y reconciliador resolvera).
    const reasonParam = paymentStatus === 'unknown' ? 'unknown' : 'pending'
    return redirectTo('/pago/resultado?status=error&reason=' + reasonParam + '&paymentId=' + payment.id + typeSuffix(payment))
  }

  if (paymentStatus === 'cancelled' || paymentStatus === 'rejected') {
    await handleRejectedPayment(payment.id, {
      newStatus: paymentStatus,
      payphoneTransactionId: String(ppResponse.transactionId || id),
      rawResponse: ppResponse,
      errorMessage: reason,
      sendEmail: false, // user-facing: la UI /pago/resultado cubre
    })

    // Alerta especial: cancelacion CON authorizationCode (puede haber
    // habido captura + reverso). Notificar admin para verificacion manual.
    if (reason === 'post_auth_cancel_or_reverso') {
      try {
        const monto = (payment.amountCents / 100).toFixed(2)
        const txId = String(ppResponse.transactionId || id)
        const adminBody = '<h3>⚠️ Posible reverso post-captura</h3>'
          + '<p>Pago marcado <strong>cancelled</strong> por PayPhone, pero la respuesta '
          + 'incluye <code>authorizationCode</code>. Verifica manualmente en PayPhone Business '
          + 'si hubo cobro real y si requiere reembolso.</p>'
          + '<ul>'
          + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
          + '<li><strong>TransactionId:</strong> ' + txId + '</li>'
          + '<li><strong>ClientTxId:</strong> ' + clientTxId + '</li>'
          + '<li><strong>Monto:</strong> $' + monto + '</li>'
          + '<li><strong>AuthorizationCode:</strong> ' + (ppResponse.authorizationCode || '-') + '</li>'
          + '</ul>'
        await notifyAdmin('[MotoPatio][⚠️ Posible reverso] PaymentId ' + payment.id, adminBody)
      } catch (e) {
        console.error('[notifyAdmin reverso]', e)
      }
    }

    const reasonQs = reason ? '&reason=' + encodeURIComponent(reason) : ''
    return redirectTo(
      '/pago/resultado?status=' + paymentStatus + reasonQs + '&paymentId=' + payment.id + typeSuffix(payment)
    )
  }

  // paymentStatus === 'approved'
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'approved',
      confirmedAt: new Date(),
    },
  })

  const result = await activatePayment(payment.id)
  if (result.status === 'missing_data') {
    console.error('Pago aprobado pero faltan datos:', payment.id, result.reason)
    return redirectTo(
      '/pago/resultado?status=error&reason=' + result.reason + '&paymentId=' + payment.id + typeSuffix(payment)
    )
  }
  const listingId =
    result.status === 'activated' || result.status === 'already_active'
      ? result.listingId
      : null
  return buildOkRedirect(payment, listingId)
}
