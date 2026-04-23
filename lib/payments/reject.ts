import { prisma } from '@/lib/prisma'
import { sendPagoNoCompletadoEmail } from '@/lib/emails'

export type RejectOptions = {
  newStatus: 'rejected' | 'cancelled'
  payphoneTransactionId?: string
  rawResponse?: unknown
  errorMessage?: string
  sendEmail?: boolean
}

/**
 * Marca un Payment como rejected o cancelled. Idempotente: si ya esta en el
 * estado destino no hace nada. Nunca regresa desde 'approved'.
 *
 * No toca Listings:
 *   - concept='plan': el Listing aun no existe (se crea solo tras approved).
 *   - concept='featured': el Listing ya existe y debe seguir activo sin destacado.
 *
 * Email: solo si sendEmail=true. El endpoint confirmar user-facing lo deja en
 * false (la UI /pago/resultado cubre); el reconciliador lo activa en true
 * porque el usuario no esta mirando pantalla.
 */
export async function handleRejectedPayment(
  paymentId: string,
  opts: RejectOptions
): Promise<{ changed: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true },
  })
  if (!payment) return { changed: false }
  if (payment.status === opts.newStatus) return { changed: false }
  if (payment.status === 'approved') return { changed: false }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: opts.newStatus,
      payphoneTransactionId:
        opts.payphoneTransactionId ?? payment.payphoneTransactionId,
      payphoneRawResponse: opts.rawResponse
        ? JSON.stringify(opts.rawResponse)
        : payment.payphoneRawResponse,
      errorMessage: opts.errorMessage ?? payment.errorMessage,
      confirmedAt: new Date(),
    },
  })

  if (opts.sendEmail) {
    const md = payment.metadata as Record<string, unknown> | null
    const draft =
      md && typeof md === 'object' && md.listingDraft && typeof md.listingDraft === 'object'
        ? (md.listingDraft as { marca?: string; modelo?: string })
        : null
    const titulo =
      draft && draft.marca && draft.modelo ? draft.marca + ' ' + draft.modelo : 'tu anuncio'
    try {
      await sendPagoNoCompletadoEmail(payment.user.email, payment.user.name || 'Usuario', {
        titulo,
        motivo: opts.newStatus,
        paymentId: payment.id,
      })
    } catch (e) {
      console.error('[handleRejectedPayment] email error:', e)
    }
  }

  return { changed: true }
}
