import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/listings/draft
 *
 * Guarda una moto como borrador (Listing con estado='borrador').
 * No requiere pago ni plan. Validacion laxa: solo marca + modelo + ciudad.
 *
 * Si se envia un draftId existente y pertenece al usuario en estado borrador,
 * se actualiza en vez de crear uno nuevo (para "Continuar" desde /mis-motos).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  type Body = {
    draftId?: string
    marca?: string
    modelo?: string
    anio?: string | number
    cilindraje?: string
    tipo?: string
    km?: string | number
    precio?: string | number
    provincia?: string
    ciudad?: string
    color?: string
    placa?: string
    descripcion?: string
    fotos?: string[]
    esElectrica?: boolean
    planId?: string
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  // Validacion minima: marca + modelo + ciudad
  const marca = (body.marca || '').trim()
  const modelo = (body.modelo || '').trim()
  const ciudad = (body.ciudad || '').trim()
  if (!marca || !modelo || !ciudad) {
    return NextResponse.json(
      { error: 'Para guardar como borrador necesitamos al menos: marca, modelo y ciudad.' },
      { status: 400 }
    )
  }

  const data = {
    marca,
    modelo,
    ciudad,
    provincia: body.provincia?.trim() || null,
    anio: parseInt(String(body.anio || 0)) || 0,
    cilindraje: (body.cilindraje || '').trim(),
    tipo: (body.tipo || '').trim(),
    km: parseInt(String(body.km || 0)) || 0,
    precio: parseFloat(String(body.precio || 0)) || 0,
    color: body.color?.trim() || null,
    placa: body.placa?.trim() || null,
    descripcion: body.descripcion?.trim() || null,
    fotos: Array.isArray(body.fotos) ? JSON.stringify(body.fotos) : null,
    esElectrica: Boolean(body.esElectrica),
    planTipo: body.planId || 'gratis',
    estado: 'borrador',
  }

  // Si llega draftId, intentamos actualizar (verificando ownership y estado)
  if (body.draftId) {
    const existing = await prisma.listing.findUnique({
      where: { id: body.draftId },
      select: { id: true, userId: true, estado: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Borrador no encontrado' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (existing.estado !== 'borrador') {
      return NextResponse.json({ error: 'Esta publicacion ya no es un borrador' }, { status: 400 })
    }
    const updated = await prisma.listing.update({
      where: { id: body.draftId },
      data: {
        ...data,
        planId: body.planId || null,
      },
    })
    return NextResponse.json({ ok: true, listingId: updated.id, action: 'updated' })
  }

  // Crear nuevo borrador
  const created = await prisma.listing.create({
    data: {
      ...data,
      user: { connect: { id: user.id } },
      ...(body.planId ? { plan: { connect: { id: body.planId } } } : {}),
    },
  })

  return NextResponse.json({ ok: true, listingId: created.id, action: 'created' })
}
