import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const VALID_ACTIONS = new Set(['created', 'updated', 'status_changed', 'marked_sold', 'deleted'])

/**
 * Actividad agregada de un dealer:
 *   stats   — totales y última acción
 *   audits  — timeline filtrable por rol del autor + tipo de acción
 *             paginado con cursor (cada N=50)
 *
 * Considera tanto auditorías de listings que pertenecen al dealer
 * (listingId.dealerId == dealer.id en el momento de la consulta) como
 * acciones donde el autor (userId) es el user del dealer — para no
 * perder rastro si el listing se borró.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const dealer = await prisma.dealer.findUnique({
    where: { id },
    select: { id: true, userId: true, nombreComercial: true, slug: true },
  })
  if (!dealer) return NextResponse.json({ error: 'Dealer no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // admin | dealer | user
  const action = searchParams.get('action') // created | updated | ...
  const cursor = searchParams.get('cursor')
  const take = 50

  // Listings que pertenecen (o pertenecieron) al dealer.
  const dealerListings = await prisma.listing.findMany({
    where: { dealerId: dealer.id },
    select: { id: true },
  })
  const listingIds = dealerListings.map((l) => l.id)

  const where: any = {
    OR: [
      ...(listingIds.length > 0 ? [{ listingId: { in: listingIds } }] : []),
      { userId: dealer.userId },
    ],
    ...(role ? { user: { is: { role } } } : {}),
    ...(action && VALID_ACTIONS.has(action) ? { action } : {}),
  }

  const audits = await prisma.listingAudit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      listing: { select: { id: true, marca: true, modelo: true, anio: true, slug: true } },
    },
  })

  const hasMore = audits.length > take
  const slice = audits.slice(0, take)
  const nextCursor = hasMore ? slice[slice.length - 1].id : null

  // Stats — siempre sobre TODOS los listings del dealer (no afectado por filtros)
  const allListings = await prisma.listing.findMany({
    where: { dealerId: dealer.id },
    select: { id: true, estado: true },
  })
  const totalPublicadas = allListings.length
  const motosVendidas = allListings.filter((l) => l.estado === 'vendido').length
  const motosActivas = allListings.filter((l) => l.estado === 'activo').length
  const ultima = await prisma.listingAudit.findFirst({
    where: {
      OR: [
        ...(listingIds.length > 0 ? [{ listingId: { in: listingIds } }] : []),
        { userId: dealer.userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { action: true, createdAt: true },
  })

  return NextResponse.json({
    dealer: { id: dealer.id, nombreComercial: dealer.nombreComercial, slug: dealer.slug },
    stats: {
      totalPublicadas,
      motosVendidas,
      motosActivas,
      ultimaAccion: ultima
        ? { action: ultima.action, createdAt: ultima.createdAt.toISOString() }
        : null,
    },
    audits: slice,
    nextCursor,
  })
}
