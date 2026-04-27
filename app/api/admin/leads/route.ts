import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { dateRangeWhereCreatedAt } from '@/lib/date-range'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') // 'dealer' | 'user'
  const fin = searchParams.get('financiamiento') // 'si' | 'no'
  const where: any = {
    ...dateRangeWhereCreatedAt({
      desde: searchParams.get('desde'),
      hasta: searchParams.get('hasta'),
    }),
  }
  if (tipo === 'dealer') where.listingOwnerType = 'dealer'
  if (tipo === 'user') where.listingOwnerType = 'user'
  if (fin === 'si') where.interesadoFinanciamiento = true
  if (fin === 'no') where.interesadoFinanciamiento = false

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
    include: {
      listing: { select: { marca: true, modelo: true, anio: true, slug: true } },
      dealer: { select: { nombreComercial: true, slug: true } },
    },
  })
  // Embudo basico
  const events = await prisma.leadEvent.groupBy({
    by: ['type'],
    _count: { _all: true },
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  })
  const funnel: Record<string, number> = {}
  for (const e of events) funnel[e.type] = e._count._all

  return NextResponse.json({ leads, funnel })
}
