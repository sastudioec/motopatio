import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanById } from '@/lib/plans'
import { getPublicCajitaConfig } from '@/lib/payphone'
import { generateClientTxId } from '@/lib/payments'

/**
 * POST /api/pagos/destacar
 *
 * Inicia el flujo de compra del add-on Destacado para un Listing
 * existente. Devuelve config de Cajita para que el frontend abra el
 * widget de PayPhone.
 *
 * Body: { listingId: string }
 * Response: { ok, paymentId, cajita }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: { listingId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }
  if (!body.listingId) {
    return NextResponse.json({ error: 'Falta listingId' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: body.listingId } })
  if (!listing) {
    return NextResponse.json({ error: 'Moto no encontrada' }, { status: 404 })
  }
  if (listing.userId !== user.id) {
    return NextResponse.json({ error: 'No tienes permiso sobre este anuncio' }, { status: 403 })
  }
  if (listing.estado !== 'activo') {
    return NextResponse.json(
      { error: 'Solo anuncios activos pueden ser destacados' },
      { status: 400 }
    )
  }
  const now = new Date()
  if (!listing.expiraEn || listing.expiraEn <= now) {
    return NextResponse.json(
      { error: 'La publicacion esta vencida, debes renovar el plan primero' },
      { status: 400 }
    )
  }
  if (listing.planTipo === 'gratis') {
    return NextResponse.json(
      { error: 'El plan Gratis no admite destacar. Sube a Basico o Full.' },
      { status: 400 }
    )
  }
  if (listing.destacadoHasta && listing.destacadoHasta > now) {
    return NextResponse.json(
      {
        error: 'Ya tienes destacado activo',
        message: 'Este anuncio ya esta destacado hasta ' + listing.destacadoHasta.toISOString(),
        destacadoHasta: listing.destacadoHasta,
      },
      { status: 400 }
    )
  }

  let plan
  try {
    plan = await getPlanById('featured')
  } catch {
    return NextResponse.json(
      { error: 'Plan Destacado no disponible' },
      { status: 503 }
    )
  }

  let cajita
  try {
    cajita = getPublicCajitaConfig()
  } catch (e) {
    console.error('PayPhone no configurado:', e)
    return NextResponse.json(
      { error: 'Pasarela de pagos no configurada. Contacta soporte.' },
      { status: 503 }
    )
  }

  const clientTransactionId = generateClientTxId('featured')

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      listingId: listing.id,
      planId: plan.id,
      planTipo: null,
      concept: 'featured',
      featuredDays: plan.featuredDays,
      amountCents: plan.priceCents,
      currency: 'USD',
      status: 'pending',
      clientTransactionId,
      metadata: { featured: { listingId: listing.id } } as object,
    },
  })

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    cajita: {
      token: process.env.PAYPHONE_TOKEN,
      storeId: cajita.storeId,
      clientTransactionId,
      amount: plan.priceCents,
      amountWithoutTax: plan.priceCents,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: 'USD',
      reference: 'Destacado 7 dias - ' + listing.marca + ' ' + listing.modelo,
      lang: 'es',
      defaultMethod: 'card',
      cssUrl: cajita.cssUrl,
      jsUrl: cajita.jsUrl,
    },
  })
}
