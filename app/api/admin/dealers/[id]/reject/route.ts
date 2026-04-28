import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendDealerRejectedEmail } from '@/lib/emails'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 1000) : null

  const dealer = await prisma.dealer.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  })
  if (!dealer) return NextResponse.json({ error: 'Dealer no encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.dealer.update({
      where: { id },
      data: {
        approvalStatus: 'rejected',
        rejectedAt: new Date(),
        approvedAt: null,
        rejectionNotes: notes,
      },
    })
    await tx.dealerVerification.updateMany({
      where: { dealerId: id, status: 'pending' },
      data: { status: 'rejected', reviewedById: auth.userId, reviewedAt: new Date(), notes },
    })
  })

  if (dealer.user.email) {
    sendDealerRejectedEmail(dealer.user.email, {
      nombreComercial: dealer.nombreComercial,
      rejectionNotes: notes,
    }).catch((e) => console.error('[dealer rejected email]', e))
  }

  return NextResponse.json({ ok: true })
}
