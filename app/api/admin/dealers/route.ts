import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending_approval'
  const where: any = {}
  if (status !== 'todos') where.approvalStatus = status

  const dealers = await prisma.dealer.findMany({
    where,
    orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { email: true, name: true } },
      verifications: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { documentType: true, documentUrl: true, status: true, notes: true },
      },
      _count: { select: { listings: true } },
    },
  })
  return NextResponse.json({ dealers })
}
