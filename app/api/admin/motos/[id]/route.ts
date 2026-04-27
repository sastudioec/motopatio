import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { logListingAction, diffFields } from '@/lib/listing-audit'

const ESTADOS_VALIDOS = ['activo', 'suspendido', 'vendido']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const before = await prisma.listing.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Moto no encontrada' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }
  const data: any = {}
  if (typeof body.estado === 'string') {
    if (!ESTADOS_VALIDOS.includes(body.estado)) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
    }
    data.estado = body.estado
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const updated = await prisma.listing.update({ where: { id }, data })

  const changes = diffFields(before as any, data, ['estado'])
  let action: 'updated' | 'status_changed' | 'marked_sold' = 'updated'
  if (changes.estado) {
    action = changes.estado.to === 'vendido' ? 'marked_sold' : 'status_changed'
  }
  await logListingAction({ listingId: id, userId: auth.userId, action, changes, req })

  return NextResponse.json({ ok: true, listing: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const before = await prisma.listing.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Moto no encontrada' }, { status: 404 })

  // Audit ANTES del delete
  await logListingAction({
    listingId: id,
    userId: auth.userId,
    action: 'deleted',
    changes: {
      marca: before.marca, modelo: before.modelo, anio: before.anio,
      precio: before.precio, estado: before.estado,
    },
    req,
  })
  await prisma.listing.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
