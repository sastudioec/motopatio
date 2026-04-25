import { prisma } from '@/lib/prisma'
import { sendPagoNoCompletadoEmail, notifyAdmin } from '@/lib/emails'

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

  try {
    const monto = (payment.amountCents / 100).toFixed(2)
    const motivoSubject =
      opts.errorMessage ??
      (opts.newStatus.charAt(0).toUpperCase() + opts.newStatus.slice(1))
    const adminBody = '<h3>Pago fallido</h3><ul>'
      + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
      + '<li><strong>Monto:</strong> $' + monto + '</li>'
      + '<li><strong>Estado:</strong> ' + opts.newStatus + '</li>'
      + '<li><strong>Motivo:</strong> ' + (opts.errorMessage || '-') + '</li>'
      + '<li><strong>Concept:</strong> ' + payment.concept + '</li>'
      + '<li><strong>Usuario:</strong> ' + (payment.user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + payment.user.email + '</li>'
      + '<li><strong>ListingId:</strong> ' + (payment.listingId || '-') + '</li>'
      + '</ul>'
    await notifyAdmin(
      '[MotoPatio][Pago Error] $' + monto + ' - ' + payment.user.email + ' - ' + motivoSubject,
      adminBody
    )
  } catch (e) {
    console.error('[notifyAdmin] pago fallido:', e)
  }

  if (opts.sendEmail) {
    const md = payment.metadata as Record<string, unknown> | null
    const isUpgrade =
      payment.concept === 'plan' && !!md && md.isUpgrade === true
    const emailConcept: 'plan' | 'featured' | 'upgrade' =
      payment.concept === 'featured' ? 'featured' : isUpgrade ? 'upgrade' : 'plan'
    const draft =
      md && typeof md === 'object' && md.listingDraft && typeof md.listingDraft === 'object'
        ? (md.listingDraft as { marca?: string; modelo?: string })
        : null
    let titulo =
      draft && draft.marca && draft.modelo ? draft.marca + ' ' + draft.modelo : 'tu anuncio'
    // Para featured y upgrade el listing ya existe; usamos su marca/modelo.
    if ((payment.concept === 'featured' || isUpgrade) && payment.listingId && (!draft || !draft.marca)) {
      const listing = await prisma.listing.findUnique({
        where: { id: payment.listingId },
        select: { marca: true, modelo: true },
      })
      if (listing?.marca && listing?.modelo) {
        titulo = listing.marca + ' ' + listing.modelo
      }
    }
    try {
      await sendPagoNoCompletadoEmail(payment.user.email, payment.user.name || 'Usuario', {
        titulo,
        motivo: opts.newStatus,
        paymentId: payment.id,
        concept: emailConcept,
      })
    } catch (e) {
      console.error('[handleRejectedPayment] email error:', e)
    }
  }

  return { changed: true }
}
