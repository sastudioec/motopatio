import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendDealerApprovedEmail } from '@/lib/emails'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  const dealer = await prisma.dealer.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  })
  if (!dealer) return NextResponse.json({ error: 'Dealer no encontrado' }, { status: 404 })

  const updated = await prisma.$transaction(async (tx) => {
    const d = await tx.dealer.update({
      where: { id },
      data: {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionNotes: null,
      },
    })
    // Aprobar todas las verificaciones pendientes (log de auditoria)
    await tx.dealerVerification.updateMany({
      where: { dealerId: id, status: 'pending' },
      data: { status: 'approved', reviewedById: auth.userId, reviewedAt: new Date() },
    })
    return d
  })

  // Cantidad de listings ya cargados que ahora se vuelven publicos
  const listingsCount = await prisma.listing.count({
    where: { dealerId: dealer.id, estado: 'activo' },
  })

  if (dealer.user.email) {
    sendDealerApprovedEmail(dealer.user.email, {
      nombreComercial: dealer.nombreComercial,
      slug: dealer.slug,
      listingsCount,
    }).catch((e) => console.error('[dealer approved email]', e))
  }

  return NextResponse.json({ ok: true, dealer: { id: updated.id, approvalStatus: updated.approvalStatus } })
}
