import { prisma } from '@/lib/prisma'
import { getPlanById, calcExpiresAt, calcFeaturedUntil } from '@/lib/plans'
import { sendMotoPublicadaEmail } from '@/lib/emails'
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

  if (payment.concept === 'plan') {
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

  return { status: 'activated', listingId: listing.id }
}

async function activateFeaturedPayment(
  payment: Awaited<ReturnType<typeof prisma.payment.findUnique>>
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
  const nuevaHasta = new Date(now)
  nuevaHasta.setDate(nuevaHasta.getDate() + days)

  await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: payment.listingId! },
      select: { destacadoHasta: true },
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
  })

  return { status: 'activated', listingId: payment.listingId }
}
