import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // 'admin' | 'dealer' | 'user' | null

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
