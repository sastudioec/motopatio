import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanById } from '@/lib/plans'
import { getPublicCajitaConfig } from '@/lib/payphone'
import { generateClientTxId } from '@/lib/payments'

type BodyData = {
  planId: string
  listingDraft: {
    marca: string
    modelo: string
    anio: string | number
    cilindraje: string
    tipo: string
    km: string | number
    precio: string | number
    provincia?: string
    ciudad: string
    color?: string
    placa?: string
    descripcion?: string
    fotos?: string[]
  }
}

export async function POST(req: NextRequest) {
  if (process.env.PAID_PLANS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'paid_plans_disabled' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: BodyData
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { planId, listingDraft } = body
  if (!planId || !listingDraft) {
    return NextResponse.json({ error: 'Faltan campos: planId, listingDraft' }, { status: 400 })
  }

  // Validar plan
  let plan
  try {
    plan = await getPlanById(planId)
  } catch {
    return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
  }

  // Solo planes pagados pasan por aqui
  if (plan.priceCents <= 0) {
    return NextResponse.json(
      { error: 'Este plan es gratis. Usa /api/listings directamente.' },
      { status: 400 }
    )
  }

  // Validar limite de fotos del plan
  const fotos = Array.isArray(listingDraft.fotos) ? listingDraft.fotos : []
  if (fotos.length > plan.maxPhotos) {
    return NextResponse.json(
      { error: 'Este plan permite maximo ' + plan.maxPhotos + ' fotos.' },
      { status: 400 }
    )
  }

  // Verificar credenciales PayPhone
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

  // Crear Payment pending con snapshot del listing en payphoneRawResponse
  // (lo guardamos ahi temporalmente; al confirmarse el pago creamos el listing real)
  const clientTransactionId = generateClientTxId('plan')

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      concept: 'plan',
      planTipo: plan.id,
      amountCents: plan.priceCents,
      currency: 'USD',
      status: 'pending',
      clientTransactionId,
      metadata: { listingDraft } as object,
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
      reference: 'Plan ' + plan.name + ' - MotoPatio',
      lang: 'es',
      defaultMethod: 'card',
      cssUrl: cajita.cssUrl,
      jsUrl: cajita.jsUrl,
    },
  })
}
