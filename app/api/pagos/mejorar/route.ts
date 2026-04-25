import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanById } from '@/lib/plans'
import { getPublicCajitaConfig } from '@/lib/payphone'
import { generateClientTxId } from '@/lib/payments'

/**
 * POST /api/pagos/mejorar
 *
 * Inicia el flujo de upgrade de plan para un Listing existente.
 * Cobra precio completo del plan nuevo (no la diferencia); el conteo
 * arranca desde cero con durationDays del plan nuevo al activarse.
 *
 * Body: { listingId: string, targetPlanId: 'basico' | 'full' }
 * Response: { ok, paymentId, cajita }
 */
type UpgradePath = { from: string; to: string }
const VALID_UPGRADES: UpgradePath[] = [
  { from: 'gratis', to: 'basico' },
  { from: 'gratis', to: 'full' },
  { from: 'basico', to: 'full' },
]

function isValidUpgrade(from: string, to: string): boolean {
  return VALID_UPGRADES.some((u) => u.from === from && u.to === to)
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

  let body: { listingId?: string; targetPlanId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }
  if (!body.listingId || !body.targetPlanId) {
    return NextResponse.json({ error: 'Faltan campos: listingId, targetPlanId' }, { status: 400 })
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
      { error: 'Solo anuncios activos pueden ser mejorados' },
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

  const currentPlanId = listing.planTipo || 'gratis'
  if (!isValidUpgrade(currentPlanId, body.targetPlanId)) {
    return NextResponse.json(
      { error: 'Upgrade no valido: de ' + currentPlanId + ' a ' + body.targetPlanId },
      { status: 400 }
    )
  }

  let targetPlan
  try {
    targetPlan = await getPlanById(body.targetPlanId)
  } catch {
    return NextResponse.json({ error: 'Plan destino no disponible' }, { status: 503 })
  }
  if (targetPlan.priceCents <= 0) {
    return NextResponse.json({ error: 'El plan destino no es pagado' }, { status: 400 })
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

  const clientTransactionId = generateClientTxId('plan')

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      listingId: listing.id,
      planId: targetPlan.id,
      planTipo: targetPlan.id,
      concept: 'plan',
      amountCents: targetPlan.priceCents,
      currency: 'USD',
      status: 'pending',
      clientTransactionId,
      metadata: {
        isUpgrade: true,
        originalPlanId: currentPlanId,
        targetPlanId: targetPlan.id,
        listingId: listing.id,
      } as object,
    },
  })

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    cajita: {
      token: process.env.PAYPHONE_TOKEN,
      storeId: cajita.storeId,
      clientTransactionId,
      amount: targetPlan.priceCents,
      amountWithoutTax: targetPlan.priceCents,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: 'USD',
      reference: 'Upgrade a ' + targetPlan.name + ' - ' + listing.marca + ' ' + listing.modelo,
      lang: 'es',
      defaultMethod: 'card',
      cssUrl: cajita.cssUrl,
      jsUrl: cajita.jsUrl,
    },
  })
}
