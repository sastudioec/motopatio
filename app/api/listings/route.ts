import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMotoPublicadaEmail, notifyAdmin } from '@/lib/emails'
import { maybeSendPhoneReminderOnPublish } from '@/lib/phone-reminder'
import {
  getPlanById,
  canPublishFreePlan,
  calcExpiresAt,
  calcFeaturedUntil,
} from '@/lib/plans'
import { buildListingSlug } from '@/lib/slug'
import { generateListingPublicId } from '@/lib/public-id'
import { logListingAction } from '@/lib/listing-audit'
import { getDealerListingsState } from '@/lib/dealers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { dealer: { select: { id: true, approvalStatus: true } } },
  })
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

  // Si el user es dealer NO aplican las reglas de cooldown ni maxPhotos del
  // plan gratis. La permanencia del listing va atada al dealer/suscripcion
  // (no a la duracion del plan particular). Para dealer rejected, bloqueamos.
  const isDealer = user.role === 'dealer' && !!user.dealer
  if (user.role === 'dealer' && (!user.dealer || user.dealer.approvalStatus === 'rejected')) {
    return NextResponse.json(
      { error: 'Tu cuenta no esta habilitada para publicar.' },
      { status: 403 }
    )
  }

  // Plan gratis: cupo de por vida (3 publicaciones), solo para particulares.
  if (plan.id === 'gratis' && !isDealer) {
    const check = await canPublishFreePlan(user.id)
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Limite de publicaciones gratuitas alcanzado',
          reason: check.reason,
          message: 'Has usado tus 3 publicaciones gratuitas. Pronto tendremos planes para que sigas publicando.',
          usedCount: check.usedCount,
          limit: check.limit,
        },
        { status: 403 }
      )
    }
  }

  // Dealer: durante el programa de lanzamiento (trial) cap de 20 motos activas.
  if (isDealer && user.dealer) {
    const dealerState = await getDealerListingsState(user.dealer.id)
    if (!dealerState.canPublish) {
      return NextResponse.json(
        {
          error: 'Limite de motos del programa alcanzado',
          reason: 'dealer_limit_reached',
          message: 'Has alcanzado el máximo de 20 motos del programa de lanzamiento. Cuando vendas alguna podrás publicar otra.',
          activeCount: dealerState.activeCount,
          limit: dealerState.limit,
        },
        { status: 403 }
      )
    }
  }

  // Validar limite de fotos segun el plan (para dealer: limite mas amplio).
  const fotos = Array.isArray(body.fotos) ? body.fotos : []
  const dealerMaxPhotos = 15
  const effectiveMaxPhotos = isDealer ? dealerMaxPhotos : plan.maxPhotos
  if (fotos.length > effectiveMaxPhotos) {
    return NextResponse.json(
      {
        error: `Maximo ${effectiveMaxPhotos} fotos por anuncio.`,
        maxPhotos: effectiveMaxPhotos,
        received: fotos.length,
      },
      { status: 400 }
    )
  }

  // Calcular fechas: dealer usa 365 dias (renovacion atada al dealer).
  const now = new Date()
  const dealerListingDurationDays = 365
  const expiraEn = calcExpiresAt(now, isDealer ? dealerListingDurationDays : plan.durationDays)
  const destacadoHasta = calcFeaturedUntil(now, plan.featuredDays)

  const publicId = await generateListingPublicId()

  // Si el user es dealer, asociar el listing a su Dealer para que aparezca
  // en /dealers/[slug] y se respete el filtro de approvalStatus en feeds.
  const dealerConnect = user.role === 'dealer' && user.dealer
    ? { dealer: { connect: { id: user.dealer.id } } }
    : {}

  // Crear la publicacion (slug se setea justo despues con el id recien creado)
  const listing = await prisma.listing.create({
    data: {
      user: { connect: { id: user.id } },
      plan: { connect: { id: plan.id } },
      ...dealerConnect,
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

  // Audit: snapshot inicial del listing creado
  await logListingAction({
    listingId: listing.id,
    userId: user.id,
    action: 'created',
    changes: {
      marca: listing.marca, modelo: listing.modelo, anio: listing.anio,
      precio: listing.precio, ciudad: listing.ciudad, planTipo: listing.planTipo,
      dealerId: listing.dealerId,
    },
    req,
  })

  // Si fue plan gratis Y es particular, actualizar la marca de tiempo del cooldown
  if (plan.id === 'gratis' && !isDealer) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastFreePublicationAt: now },
    })
  }

  // Email de confirmacion: solo si la moto YA es publica.
  //   - Particular: siempre publica (manda email)
  //   - Dealer aprobado: publica (manda email)
  //   - Dealer pending_approval: NO publica todavia, NO mandar email
  //     (el email viene cuando admin aprueba el dealer, con resumen)
  const motoEsPublica = !isDealer || user.dealer?.approvalStatus === 'approved'
  if (motoEsPublica) {
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
    await maybeSendPhoneReminderOnPublish(user.id, {
      titulo: body.marca + ' ' + body.modelo,
      slug: (listing as any).slug || listing.id,
    })
  } else {
    console.log('[listing creado] dealer pending — skipping moto publicada email (' + listing.id + ')')
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
  // Listings publicos: activos Y (sin dealer O con dealer aprobado).
  // Los listings de dealers pendientes/rechazados quedan ocultos del feed.
  const listings = await prisma.listing.findMany({
    where: {
      estado: 'activo',
      OR: [
        { dealerId: null },
        { dealer: { approvalStatus: 'approved', activo: true } },
      ],
    },
    include: {
      user: { select: { name: true, phone: true } },
      dealer: { select: { id: true, slug: true, nombreComercial: true, verificado: true, approvalStatus: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ listings })
}
