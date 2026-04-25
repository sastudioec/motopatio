import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMotoPublicadaEmail, notifyAdmin } from '@/lib/emails'
import {
  getPlanById,
  canPublishFreePlan,
  calcExpiresAt,
  calcFeaturedUntil,
} from '@/lib/plans'
import { buildListingSlug } from '@/lib/slug'
import { generateListingPublicId } from '@/lib/public-id'

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

  // Plan gratis: validar regla de 1 anuncio cada 30 dias + no tener activo
  if (plan.id === 'gratis') {
    const check = await canPublishFreePlan(user.id)
    if (!check.allowed) {
      const message =
        check.reason === 'active'
          ? 'Ya tienes un anuncio gratuito activo. Suspendelo, espera a que expire, o elige Basico/Full.'
          : `Debes esperar ${check.daysRemaining} dia(s) para publicar gratis de nuevo.`
      return NextResponse.json(
        {
          error:
            check.reason === 'active'
              ? 'Ya tienes un anuncio Gratis activo'
              : 'Cooldown activo para plan Gratis',
          reason: check.reason,
          message,
          nextAvailableAt: check.nextAvailableAt,
          daysRemaining: check.daysRemaining,
        },
        { status: check.reason === 'active' ? 400 : 429 }
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

  const publicId = await generateListingPublicId()

  // Crear la publicacion (slug se setea justo despues con el id recien creado)
  const listing = await prisma.listing.create({
    data: {
      user: { connect: { id: user.id } },
      plan: { connect: { id: plan.id } },
      publicId,
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
        slug: (listing as any).slug || listing.id,
        publicId,
        precio: parseInt(body.precio) || 0,
      }
    )
  } catch (e) {
    console.error('Email error:', e)
  }

  try {
    const titulo = body.marca + ' ' + body.modelo
    const slugVal = (listing as any).slug || listing.id
    const precio = parseInt(body.precio) || 0
    const adminBody = '<h3>Nueva moto publicada</h3><ul>'
      + '<li><strong>Título:</strong> ' + titulo + '</li>'
      + '<li><strong>Plan:</strong> ' + plan.id + '</li>'
      + '<li><strong>Precio:</strong> $' + precio + '</li>'
      + '<li><strong>Ciudad:</strong> ' + body.ciudad + '</li>'
      + '<li><strong>Usuario:</strong> ' + (user.name || 'Usuario') + '</li>'
      + '<li><strong>Email:</strong> ' + user.email + '</li>'
      + '<li><strong>Link:</strong> <a href="https://motopatio.com/motos/' + slugVal + '">https://motopatio.com/motos/' + slugVal + '</a></li>'
      + '<li><strong>PublicId:</strong> ' + publicId + '</li>'
      + '</ul>'
    await notifyAdmin('[MotoPatio][Moto] Nueva: ' + titulo + ' [' + plan.id + ']', adminBody)
  } catch (e) {
    console.error('[notifyAdmin] moto gratis:', e)
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
