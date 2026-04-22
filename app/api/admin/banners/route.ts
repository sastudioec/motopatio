import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Listar todos los banners con sus contadores
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { impressions: true, clicks: true } },
    },
  })

  return NextResponse.json({ banners })
}

// Crear un banner nuevo
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const { title, advertiser, imageUrl, linkUrl, position, startDate, endDate, active } = body

  // Validaciones básicas
  if (!title || !imageUrl || !position || !startDate || !endDate) {
    return NextResponse.json({ error: 'Campos obligatorios: title, imageUrl, position, startDate, endDate' }, { status: 400 })
  }
  if (!['hero', 'mid_left', 'mid_right'].includes(position)) {
    return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })
  }

  const banner = await prisma.banner.create({
    data: {
      title,
      advertiser: advertiser || null,
      imageUrl,
      linkUrl: linkUrl || null,
      position,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      active: active !== false,
    },
  })

  return NextResponse.json({ banner })
}
