import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { confirmTransaction } from '@/lib/payphone'
import { activatePayment } from '@/lib/payments/activate'

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

  // Idempotencia: si ya fue aprobado, no reprocesar. activatePayment es
  // idempotente tambien, asi que en caso de race entre redirect y cron,
  // el segundo llamador ve already_active.
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

  const approved = ppResponse.transactionStatus === 'Approved'
  const canceled = ppResponse.transactionStatus === 'Canceled'
  const newStatus = approved ? 'approved' : canceled ? 'cancelled' : 'rejected'

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      payphoneTransactionId: String(ppResponse.transactionId || id),
      payphoneRawResponse: JSON.stringify(ppResponse),
      confirmedAt: new Date(),
    },
  })

  if (canceled) {
    return redirectTo('/pago/resultado?status=cancelled&paymentId=' + payment.id)
  }
  if (!approved) {
    return redirectTo('/pago/resultado?status=rejected&paymentId=' + payment.id)
  }

  // Pago aprobado: delegar activacion al helper
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
