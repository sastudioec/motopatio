import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { confirmTransaction, mapPayphoneStatus } from '@/lib/payphone'
import { activatePayment } from '@/lib/payments/activate'
import { handleRejectedPayment } from '@/lib/payments/reject'

function getBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!url) return 'https://motopatio.com'
  return url.replace(/\/$/, '')
}

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(getBaseUrl() + path)
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
    const suffix = listingId ? '&listingId=' + listingId : ''
    return redirectTo('/pago/resultado?status=ok&paymentId=' + payment.id + suffix)
  }

  // Confirmar contra PayPhone
  let ppResponse
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
    return redirectTo('/pago/resultado?status=error&reason=confirm&paymentId=' + payment.id)
  }

  const { paymentStatus } = mapPayphoneStatus(ppResponse)

  if (paymentStatus === 'pending') {
    // No tocamos el status (sigue pending); el reconciliador lo revisara.
    return redirectTo('/pago/resultado?status=error&reason=pending&paymentId=' + payment.id)
  }

  if (paymentStatus === 'cancelled' || paymentStatus === 'rejected') {
    await handleRejectedPayment(payment.id, {
      newStatus: paymentStatus,
      payphoneTransactionId: String(ppResponse.transactionId || id),
      rawResponse: ppResponse,
      sendEmail: false, // user-facing: la UI /pago/resultado cubre
    })
    return redirectTo(
      '/pago/resultado?status=' + paymentStatus + '&paymentId=' + payment.id
    )
  }

  // paymentStatus === 'approved'
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'approved',
      payphoneTransactionId: String(ppResponse.transactionId || id),
      payphoneRawResponse: JSON.stringify(ppResponse),
      confirmedAt: new Date(),
    },
  })

  const result = await activatePayment(payment.id)
  if (result.status === 'missing_data') {
    console.error('Pago aprobado pero faltan datos:', payment.id, result.reason)
    return redirectTo(
      '/pago/resultado?status=error&reason=' + result.reason + '&paymentId=' + payment.id
    )
  }
  const listingId =
    result.status === 'activated' || result.status === 'already_active'
      ? result.listingId
      : null
  const suffix = listingId ? '&listingId=' + listingId : ''
  return redirectTo('/pago/resultado?status=ok&paymentId=' + payment.id + suffix)
}
