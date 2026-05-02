import { prisma } from '@/lib/prisma'
import { getPlanById, calcExpiresAt, calcFeaturedUntil } from '@/lib/plans'
import { sendMotoPublicadaEmail, sendDestacadoActivadoEmail, sendPlanMejoradoEmail, notifyAdmin } from '@/lib/emails'
import { maybeSendPhoneReminderOnPublish } from '@/lib/phone-reminder'
import { buildListingSlug } from '@/lib/slug'
import { generateListingPublicId } from '@/lib/public-id'

export type ActivateResult =
  | { status: 'already_active'; listingId: string | null }
  | { status: 'activated'; listingId: string }
  | { status: 'skipped_not_approved'; listingId: null }
  | { status: 'missing_data'; listingId: null; reason: 'nodraft' | 'noplan' | 'nolisting' }

type ListingDraft = {
  marca: string
  modelo: string
  anio: string | number
  cilindraje: string
  tipo: string
  km: string | number
  precio: string | number
  ciudad: string
  provincia?: string
  color?: string
  placa?: string
  descripcion?: string
  fotos?: string[]
}

function extractDraftFromMetadata(meta: unknown): ListingDraft | null {
  if (!meta || typeof meta !== 'object') return null
  const m = meta as Record<string, unknown>
  const d = m.listingDraft
  if (!d || typeof d !== 'object') return null
  return d as ListingDraft
}

function extractDraftFromRaw(raw: string | null): ListingDraft | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed.listingDraft || null
  } catch {
    return null
  }
}

/**
 * Activa el efecto de un Payment aprobado (crear listing para concept='plan'
 * o extender destacado para concept='featured'). Idempotente: si ya fue
 * activado devuelve 'already_active' sin tocar nada.
 *
 * Consumido por:
 *  - /api/pagos/confirmar (redirect del usuario)
 *  - /api/pagos/reconciliar (cron, futuro)
 */
export async function activatePayment(paymentId: string): Promise<ActivateResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true, plan: true },
  })
  if (!payment) return { status: 'missing_data', listingId: null, reason: 'nolisting' }
  if (payment.status !== 'approved') {
    return { status: 'skipped_not_approved', listingId: null }
  }

  // Idempotencia: marker comun a plan y featured. Si ya fue activado
  // (por user-facing o por reconciliador), skip.
  if (payment.activatedAt) {
    return { status: 'already_active', listingId: payment.listingId }
  }

  if (payment.concept === 'plan') {
    const md = payment.metadata as Record<string, unknown> | null
    if (md && md.isUpgrade === true) {
      return activateUpgradePayment(payment)
    }
    return activatePlanPayment(payment)
  }
  if (payment.concept === 'featured') {
    return activateFeaturedPayment(payment)
  }
  return { status: 'missing_data', listingId: null, reason: 'noplan' }
}

async function activatePlanPayment(
  payment: Awaited<ReturnType<typeof prisma.payment.findUnique>> & { user: { email: string; name: string | null } }
): Promise<ActivateResult> {
  if (!payment) return { status: 'missing_data', listingId: null, reason: 'nolisting' }

  if (payment.listingId) {
    return { status: 'already_active', listingId: payment.listingId }
  }
  if (!payment.planId) {
    console.error('[activatePayment] plan sin planId. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'noplan' }
  }

  const draft =
    extractDraftFromMetadata(payment.metadata) ??
    extractDraftFromRaw(payment.payphoneRawResponse)
  if (!draft) {
    console.error('[activatePayment] plan sin listingDraft. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'nodraft' }
  }

  const plan = await getPlanById(payment.planId)
  const now = new Date()
  const expiraEn = calcExpiresAt(now, plan.durationDays)
  const destacadoHasta = calcFeaturedUntil(now, plan.featuredDays)
  const publicId = await generateListingPublicId()

  const listing = await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { listingId: true },
    })
    if (fresh?.listingId) {
      return { id: fresh.listingId, _alreadyLinked: true } as const
    }

    const created = await tx.listing.create({
      data: {
        user: { connect: { id: payment.userId } },
        plan: { connect: { id: plan.id } },
        publicId,
        marca: draft.marca,
        modelo: draft.modelo,
        anio: parseInt(String(draft.anio)) || 0,
        cilindraje: draft.cilindraje,
        tipo: draft.tipo,
        km: parseInt(String(draft.km)) || 0,
        precio: parseInt(String(draft.precio)) || 0,
        ciudad: draft.ciudad,
        provincia: draft.provincia || null,
        color: draft.color || null,
        placa: draft.placa || null,
        descripcion: draft.descripcion || null,
        fotos: JSON.stringify(draft.fotos || []),
        estado: 'activo',
        planTipo: plan.id,
        publishedAt: now,
        expiraEn,
        destacado: destacadoHasta !== null,
        destacadoHasta,
      },
    })

    const slug = buildListingSlug(created)
    await tx.listing.update({ where: { id: created.id }, data: { slug } })
    await tx.payment.update({
      where: { id: payment.id },
      data: { listingId: created.id },
    })

    return { ...created, slug, _alreadyLinked: false } as const
  })

  if (listing._alreadyLinked) {
    return { status: 'already_active', listingId: listing.id }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { activatedAt: new Date() },
  })

  try {
    await sendMotoPublicadaEmail(
      payment.user.email,
      payment.user.name || 'Usuario',
      {
        titulo: draft.marca + ' ' + draft.modelo,
        slug: listing.slug || listing.id,
        publicId,
        precio: parseInt(String(draft.precio)) || 0,
      }
    )
  } catch (e) {
    console.error('[activatePayment] email error:', e)
  }

  await maybeSendPhoneReminderOnPublish(payment.userId, {
    titulo: draft.marca + ' ' + draft.modelo,
    slug: listing.slug || listing.id,
  })

  try {
    const titulo = draft.marca + ' ' + draft.modelo
    const slugVal = listing.slug || listing.id
    const precio = parseInt(String(draft.precio)) || 0
    const adminBody = '<h3>Nueva moto publicada</h3><ul>'
      + '<li><strong>Título:</strong> ' + titulo + '</li>'
      + '<li><strong>Plan:</strong> ' + plan.id + '</li>'
      + '<li><strong>Precio:</strong> $' + precio + '</li>'
      + '<li><strong>Ciudad:</strong> ' + draft.ciudad + '</li>'
      + '<li><strong>Usuario:</strong> ' + (payment.user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + payment.user.email + '</li>'
      + '<li><strong>Link:</strong> <a href="https://motopatio.com/motos/' + slugVal + '">https://motopatio.com/motos/' + slugVal + '</a></li>'
      + '<li><strong>PublicId:</strong> ' + publicId + '</li>'
      + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
      + '</ul>'
    await notifyAdmin('[MotoPatio][Moto] Nueva: ' + titulo + ' [' + plan.id + ']', adminBody)
  } catch (e) {
    console.error('[notifyAdmin] moto pagada:', e)
  }

  try {
    const monto = (payment.amountCents / 100).toFixed(2)
    const adminBody = '<h3>Pago aprobado</h3><ul>'
      + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
      + '<li><strong>Monto:</strong> $' + monto + '</li>'
      + '<li><strong>Concept:</strong> plan</li>'
      + '<li><strong>Plan:</strong> ' + plan.name + '</li>'
      + '<li><strong>Usuario:</strong> ' + (payment.user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + payment.user.email + '</li>'
      + '<li><strong>TransactionId:</strong> ' + (payment.payphoneTransactionId || '-') + '</li>'
      + '<li><strong>ListingId:</strong> ' + listing.id + '</li>'
      + '</ul>'
    await notifyAdmin('[MotoPatio][Pago OK] $' + monto + ' - ' + payment.user.email, adminBody)
  } catch (e) {
    console.error('[notifyAdmin] pago aprobado plan:', e)
  }

  return { status: 'activated', listingId: listing.id }
}

async function activateFeaturedPayment(
  payment: Awaited<ReturnType<typeof prisma.payment.findUnique>> & {
    user: { email: string; name: string | null }
  }
): Promise<ActivateResult> {
  if (!payment) return { status: 'missing_data', listingId: null, reason: 'nolisting' }
  if (!payment.listingId) {
    console.error('[activatePayment] featured sin listingId. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'nolisting' }
  }
  const days = payment.featuredDays
  if (!days || days <= 0) {
    console.error('[activatePayment] featured sin featuredDays. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'nodraft' }
  }

  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: payment.listingId! },
      select: { destacadoHasta: true, marca: true, modelo: true, anio: true, slug: true, id: true, publicId: true },
    })
    if (!listing) throw new Error('Listing no encontrado: ' + payment.listingId)
    const base =
      listing.destacadoHasta && listing.destacadoHasta > now
        ? listing.destacadoHasta
        : now
    const extendido = new Date(base)
    extendido.setDate(extendido.getDate() + days)
    await tx.listing.update({
      where: { id: payment.listingId! },
      data: { destacado: true, destacadoHasta: extendido },
    })
    await tx.payment.update({
      where: { id: payment.id },
      data: { activatedAt: now },
    })
    return { listing, destacadoHasta: extendido }
  })

  try {
    await sendDestacadoActivadoEmail(payment.user.email, payment.user.name || 'Usuario', {
      titulo: `${result.listing.marca} ${result.listing.modelo} ${result.listing.anio}`,
      slug: result.listing.slug || result.listing.id,
      destacadoHasta: result.destacadoHasta,
    })
  } catch (e) {
    console.error('[activatePayment] email featured error:', e)
  }

  try {
    const monto = (payment.amountCents / 100).toFixed(2)
    const adminBody = '<h3>Pago aprobado</h3><ul>'
      + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
      + '<li><strong>Monto:</strong> $' + monto + '</li>'
      + '<li><strong>Concept:</strong> featured</li>'
      + '<li><strong>FeaturedDays:</strong> ' + days + '</li>'
      + '<li><strong>Usuario:</strong> ' + (payment.user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + payment.user.email + '</li>'
      + '<li><strong>TransactionId:</strong> ' + (payment.payphoneTransactionId || '-') + '</li>'
      + '<li><strong>ListingId:</strong> ' + payment.listingId + '</li>'
      + '</ul>'
    await notifyAdmin('[MotoPatio][Pago OK] $' + monto + ' - ' + payment.user.email, adminBody)
  } catch (e) {
    console.error('[notifyAdmin] pago aprobado featured:', e)
  }

  return { status: 'activated', listingId: payment.listingId }
}

/**
 * Activa un upgrade de plan (Gratis->Basico/Full, Basico->Full). Actualiza
 * el Listing existente con el plan nuevo; no crea uno nuevo. Mantiene
 * publishedAt original. Recalcula expiraEn = NOW + durationDays del plan
 * nuevo. Si target trae featuredDays, destacadoHasta = max(existente, NOW + featuredDays).
 * Idempotente via activatedAt.
 */
async function activateUpgradePayment(
  payment: Awaited<ReturnType<typeof prisma.payment.findUnique>> & {
    user: { email: string; name: string | null }
  }
): Promise<ActivateResult> {
  if (!payment) return { status: 'missing_data', listingId: null, reason: 'nolisting' }
  if (!payment.listingId) {
    console.error('[activatePayment] upgrade sin listingId. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'nolisting' }
  }
  if (!payment.planId) {
    console.error('[activatePayment] upgrade sin planId. Payment:', payment.id)
    return { status: 'missing_data', listingId: null, reason: 'noplan' }
  }

  const targetPlan = await getPlanById(payment.planId)
  const now = new Date()
  const newExpiraEn = calcExpiresAt(now, targetPlan.durationDays)
  const newFeaturedFromTarget = calcFeaturedUntil(now, targetPlan.featuredDays)

  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: payment.listingId! },
      select: {
        id: true,
        marca: true,
        modelo: true,
        anio: true,
        slug: true,
        publicId: true,
        destacadoHasta: true,
      },
    })
    if (!listing) throw new Error('Listing no encontrado: ' + payment.listingId)

    // destacadoHasta: max(existente, NOW + featuredDays). Si target no
    // incluye featured y el listing tenia destacado activo, se conserva.
    let finalDestacadoHasta: Date | null = listing.destacadoHasta ?? null
    if (newFeaturedFromTarget) {
      finalDestacadoHasta =
        listing.destacadoHasta && listing.destacadoHasta > newFeaturedFromTarget
          ? listing.destacadoHasta
          : newFeaturedFromTarget
    }

    await tx.listing.update({
      where: { id: payment.listingId! },
      data: {
        plan: { connect: { id: targetPlan.id } },
        planTipo: targetPlan.id,
        expiraEn: newExpiraEn,
        destacado: finalDestacadoHasta !== null && finalDestacadoHasta > now,
        destacadoHasta: finalDestacadoHasta,
      },
    })
    await tx.payment.update({
      where: { id: payment.id },
      data: { activatedAt: now },
    })
    return { listing, finalDestacadoHasta }
  })

  try {
    await sendPlanMejoradoEmail(payment.user.email, payment.user.name || 'Usuario', {
      titulo: result.listing.marca + ' ' + result.listing.modelo,
      slug: result.listing.slug || result.listing.id,
      planName: targetPlan.name,
      planId: targetPlan.id,
      durationDays: targetPlan.durationDays,
      expiraEn: newExpiraEn,
      featuredUntil: result.finalDestacadoHasta,
    })
  } catch (e) {
    console.error('[activatePayment] email upgrade error:', e)
  }

  try {
    const monto = (payment.amountCents / 100).toFixed(2)
    const adminBody = '<h3>Pago aprobado</h3><ul>'
      + '<li><strong>PaymentId:</strong> ' + payment.id + '</li>'
      + '<li><strong>Monto:</strong> $' + monto + '</li>'
      + '<li><strong>Concept:</strong> upgrade</li>'
      + '<li><strong>Plan destino:</strong> ' + targetPlan.name + '</li>'
      + '<li><strong>Usuario:</strong> ' + (payment.user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + payment.user.email + '</li>'
      + '<li><strong>TransactionId:</strong> ' + (payment.payphoneTransactionId || '-') + '</li>'
      + '<li><strong>ListingId:</strong> ' + payment.listingId + '</li>'
      + '</ul>'
    await notifyAdmin('[MotoPatio][Pago OK] $' + monto + ' - ' + payment.user.email, adminBody)
  } catch (e) {
    console.error('[notifyAdmin] pago aprobado upgrade:', e)
  }

  return { status: 'activated', listingId: payment.listingId }
}
