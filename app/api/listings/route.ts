import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMotoPublicadaEmail } from '@/lib/emails'
import {
  getPlanById,
  canPublishFreePlan,
  calcExpiresAt,
  calcFeaturedUntil,
} from '@/lib/plans'
import { buildListingSlug } from '@/lib/slug'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body = await req.json()
  const planId = (body.planId || 'gratis') as string

  // Validar que el plan existe y esta activo
  let plan
  try {
    plan = await getPlanById(planId)
  } catch {
    return NextResponse.json(
      { error: 'Plan invalido' },
      { status: 400 }
    )
  }

  // Planes pagados no se crean aqui, se crean tras confirmacion de pago en PayPhone
  if (plan.priceCents > 0) {
    return NextResponse.json(
      {
        error: 'Plan pagado requiere pago previo',
        hint: 'Usa /api/pagos/iniciar para procesar el pago. La publicacion se crea al confirmarse.',
      },
      { status: 402 }
    )
  }

  // Plan gratis: validar cooldown
  if (plan.id === 'gratis') {
    const check = await canPublishFreePlan(user.id)
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Cooldown activo para plan Gratis',
          message: `Debes esperar ${check.daysRemaining} dia(s) para publicar gratis de nuevo.`,
          nextAvailableAt: check.nextAvailableAt,
          daysRemaining: check.daysRemaining,
        },
        { status: 429 }
      )
    }
  }

  // Validar limite de fotos segun el plan
  const fotos = Array.isArray(body.fotos) ? body.fotos : []
  if (fotos.length > plan.maxPhotos) {
    return NextResponse.json(
      {
        error: `Este plan permite maximo ${plan.maxPhotos} fotos.`,
        maxPhotos: plan.maxPhotos,
        received: fotos.length,
      },
      { status: 400 }
    )
  }

  // Calcular fechas segun el plan
  const now = new Date()
  const expiraEn = calcExpiresAt(now, plan.durationDays)
  const destacadoHasta = calcFeaturedUntil(now, plan.featuredDays)

  // Crear la publicacion (slug se setea justo despues con el id recien creado)
  const listing = await prisma.listing.create({
    data: {
      user: { connect: { id: user.id } },
      plan: { connect: { id: plan.id } },
      marca: body.marca,
      modelo: body.modelo,
      anio: parseInt(body.anio) || 0,
      cilindraje: body.cilindraje,
      tipo: body.tipo,
      km: parseInt(body.km) || 0,
      precio: parseInt(body.precio) || 0,
      ciudad: body.ciudad,
      provincia: body.provincia || null,
      color: body.color,
      placa: body.placa,
      descripcion: body.descripcion,
      fotos: JSON.stringify(fotos),
      estado: 'activo',
      planTipo: plan.id,
      publishedAt: now,
      expiraEn,
      destacado: destacadoHasta !== null,
      destacadoHasta,
    },
  })

  const slug = buildListingSlug(listing)
  await prisma.listing.update({ where: { id: listing.id }, data: { slug } })
  ;(listing as any).slug = slug

  // Si fue plan gratis, actualizar la marca de tiempo para el cooldown
  if (plan.id === 'gratis') {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastFreePublicationAt: now },
    })
  }

  // Email de confirmacion (no bloquear si falla)
  try {
    await sendMotoPublicadaEmail(
      user.email,
      user.name || 'Usuario',
      {
        titulo: body.marca + ' ' + body.modelo,
        id: listing.id,
        precio: parseInt(body.precio) || 0,
      }
    )
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ ok: true, listing })
}

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo' },
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ listings })
}
