import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  const [banner, impressions, clicks] = await Promise.all([
    prisma.banner.findUnique({ where: { id } }),
    prisma.bannerImpression.count({ where: { bannerId: id } }),
    prisma.bannerClick.count({ where: { bannerId: id } }),
  ])

  if (!banner) return NextResponse.json({ error: 'No existe' }, { status: 404 })

  // Últimos 30 días agrupado por día
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const dailyImpressions = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM BannerImpression
    WHERE bannerId = ${id} AND createdAt >= ${thirtyDaysAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `
  const dailyClicks = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM BannerClick
    WHERE bannerId = ${id} AND createdAt >= ${thirtyDaysAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `

  // Convertir bigint a number para JSON
  const imp = dailyImpressions.map(r => ({ date: r.date, count: Number(r.count) }))
  const clk = dailyClicks.map(r => ({ date: r.date, count: Number(r.count) }))

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

  return NextResponse.json({
    banner,
    totals: { impressions, clicks, ctr: Math.round(ctr * 100) / 100 },
    daily: { impressions: imp, clicks: clk },
  })
}
