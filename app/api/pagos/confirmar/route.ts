import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { confirmTransaction } from '@/lib/payphone'
import { getPlanById, calcExpiresAt, calcFeaturedUntil } from '@/lib/plans'
import { sendMotoPublicadaEmail } from '@/lib/emails'

/**
 * Retorna la URL base publica del sitio. Evita usar req.url
 * porque detras de proxy puede ser localhost:3000.
 */
function getBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!url) return 'https://motopatio.com'
  return url.replace(/\/$/, '')
}

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(getBaseUrl() + path)
}

/**
 * PayPhone redirige aqui (GET) tras el pago con:
 *   ?id=<number>&clientTransactionId=<string>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const clientTxId = searchParams.get('clientTransactionId')

  if (!id || !clientTxId) {
    return redirectTo('/pago/resultado?status=error&reason=params')
  }

  const payment = await prisma.payment.findUnique({
    where: { clientTransactionId: clientTxId },
    include: { user: true, plan: true },
  })

  if (!payment) {
    return redirectTo('/pago/resultado?status=error&reason=notfound')
  }

  // Idempotencia: si ya fue aprobado, no lo procesamos de nuevo
  if (payment.status === 'approved') {
    return redirectTo('/pago/resultado?status=ok&paymentId=' + payment.id)
  }

  // Confirmar contra PayPhone
  let ppResponse
  try {
    ppResponse = await confirmTransaction({ id: parseInt(id), clientTxId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'error',
        errorMessage: msg,
        payphoneTransactionId: String(id),
      },
    })
    console.error('PayPhone confirm error:', msg)
    return redirectTo('/pago/resultado?status=error&reason=confirm&paymentId=' + payment.id)
  }

  const approved = ppResponse.transactionStatus === 'Approved'
  const canceled = ppResponse.transactionStatus === 'Canceled'

  // Actualizar Payment con respuesta de PayPhone
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: approved ? 'approved' : canceled ? 'cancelled' : 'rejected',
      payphoneTransactionId: String(ppResponse.transactionId || id),
      payphoneRawResponse: JSON.stringify({
        listingDraft: extractListingDraft(payment.payphoneRawResponse),
        payphone: ppResponse,
      }),
      confirmedAt: new Date(),
    },
  })

  if (canceled) {
    return redirectTo('/pago/resultado?status=cancelled&paymentId=' + payment.id)
  }

  if (!approved) {
    return redirectTo('/pago/resultado?status=rejected&paymentId=' + payment.id)
  }

  // Pago aprobado: crear el listing
  const draft = extractListingDraft(payment.payphoneRawResponse)
  if (!draft) {
    console.error('Pago aprobado pero sin listingDraft. Payment:', payment.id)
    return redirectTo('/pago/resultado?status=error&reason=nodraft&paymentId=' + payment.id)
  }

  if (!payment.planId) {
    console.error('Pago aprobado pero sin planId. Payment:', payment.id)
    return redirectTo('/pago/resultado?status=error&reason=noplan&paymentId=' + payment.id)
  }

  const plan = await getPlanById(payment.planId)
  const now = new Date()
  const expiraEn = calcExpiresAt(now, plan.durationDays)
  const destacadoHasta = calcFeaturedUntil(now, plan.featuredDays)

  const listing = await prisma.listing.create({
    data: {
      user: { connect: { id: payment.userId } },
      plan: { connect: { id: plan.id } },
      marca: draft.marca,
      modelo: draft.modelo,
      anio: parseInt(String(draft.anio)) || 0,
      cilindraje: draft.cilindraje,
      tipo: draft.tipo,
      km: parseInt(String(draft.km)) || 0,
      precio: parseInt(String(draft.precio)) || 0,
      ciudad: draft.ciudad,
      provincia: draft.provincia || null,
      color: draft.color || null,
      placa: draft.placa || null,
      descripcion: draft.descripcion || null,
      fotos: JSON.stringify(draft.fotos || []),
      estado: 'activo',
      planTipo: plan.id,
      publishedAt: now,
      expiraEn,
      destacado: destacadoHasta !== null,
      destacadoHasta,
    },
  })

  await prisma.payment.update({
    where: { id: payment.id },
    data: { listingId: listing.id },
  })

  try {
    await sendMotoPublicadaEmail(
      payment.user.email,
      payment.user.name || 'Usuario',
      {
        titulo: draft.marca + ' ' + draft.modelo,
        id: listing.id,
        precio: parseInt(String(draft.precio)) || 0,
      }
    )
  } catch (e) {
    console.error('Email error:', e)
  }

  return redirectTo('/pago/resultado?status=ok&paymentId=' + payment.id + '&listingId=' + listing.id)
}

function extractListingDraft(raw: string | null): {
  marca: string
  modelo: string
  anio: string | number
  cilindraje: string
  tipo: string
  km: string | number
  precio: string | number
  ciudad: string
  provincia?: string
  color?: string
  placa?: string
  descripcion?: string
  fotos?: string[]
} | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed.listingDraft || null
  } catch {
    return null
  }
}