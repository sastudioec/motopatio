import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Historial de auditoria del listing del usuario logueado. Permite que
 * tanto el dueño particular como el dealer dueño vean acciones que
 * cualquier rol (incluido admin) hizo sobre su listing.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, dealer: { select: { id: true } } },
  })
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true, dealerId: true },
  })
  if (!listing) return NextResponse.json({ error: 'Moto no encontrada' }, { status: 404 })

  // Ownership: el listing es del user O el dealer del user es dueño del listing.
  const isOwner = listing.userId === user.id
  const isDealerOwner = !!user.dealer && !!listing.dealerId && listing.dealerId === user.dealer.id
  if (!isOwner && !isDealerOwner) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const audits = await prisma.listingAudit.findMany({
    where: {
      listingId: id,
      ...(role ? { user: { is: { role } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })
  return NextResponse.json({ audits })
}
