import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// Actualizar un banner
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()

  const data: any = {}
  if (body.title !== undefined) data.title = body.title
  if (body.advertiser !== undefined) data.advertiser = body.advertiser || null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl || null
  if (body.position !== undefined) {
    if (!['hero', 'mid_left', 'mid_right'].includes(body.position)) {
      return NextResponse.json({ error: 'Posición inválida' }, { status: 400 })
    }
    data.position = body.position
  }
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
  if (body.endDate !== undefined) data.endDate = new Date(body.endDate)
  if (body.active !== undefined) data.active = !!body.active

  const banner = await prisma.banner.update({ where: { id }, data })
  return NextResponse.json({ banner })
}

// Eliminar un banner (y su imagen local si es nuestra)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  // Recuperar el banner para limpiar la imagen local si aplica
  const banner = await prisma.banner.findUnique({ where: { id } })
  if (!banner) return NextResponse.json({ error: 'No existe' }, { status: 404 })

  // Si la imagen es local (/banners/xxx), intentar borrarla del disco
  if (banner.imageUrl.startsWith('/banners/')) {
    const filePath = path.join(process.cwd(), 'public', banner.imageUrl)
    try {
      await fs.unlink(filePath)
    } catch (err) {
      // No bloqueamos el delete si la imagen ya no existe
      console.warn('No se pudo borrar imagen local:', filePath)
    }
  }

  // El onDelete: Cascade en el schema se encarga de impressions y clicks
  await prisma.banner.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
