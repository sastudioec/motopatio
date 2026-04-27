import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dealersEnabled } from '@/lib/dealer-flags'
import { requireDealer } from '@/lib/dealer-auth'
import { trialDaysRemaining } from '@/lib/dealers'

const EDITABLE_FIELDS = [
  'nombreComercial',
  'descripcion',
  'logo',
  'bannerImage',
  'direccion',
  'ciudad',
  'provincia',
  'googleMapsUrl',
  'telefono',
  'whatsapp',
  'emailContacto',
  'sitioWeb',
  'redes',
] as const

export async function GET() {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const auth = await requireDealer()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const dealer = await prisma.dealer.findUnique({ where: { id: auth.dealerId } })
  if (!dealer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Pendientes de verificacion (los documentos que subio el dealer)
  const verifications = await prisma.dealerVerification.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, documentType: true, status: true, createdAt: true, reviewedAt: true, notes: true },
  })
  return NextResponse.json({
    dealer: {
      ...dealer,
      trialDaysRemaining: trialDaysRemaining(dealer.trialEndsAt),
    },
    verifications,
  })
}

export async function PATCH(req: NextRequest) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const auth = await requireDealer()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }
  const data: Record<string, any> = {}
  for (const f of EDITABLE_FIELDS) {
    if (f in body) {
      const v = body[f]
      if (f === 'redes') {
        data[f] = v && typeof v === 'object' ? v : null
      } else if (typeof v === 'string') {
        const trimmed = v.trim()
        data[f] = trimmed === '' ? null : trimmed
      } else if (v === null) {
        data[f] = null
      }
    }
  }
  if (typeof data.descripcion === 'string' && data.descripcion.length > 1000) {
    return NextResponse.json({ error: 'Descripcion supera 1000 caracteres' }, { status: 400 })
  }
  // nombreComercial es required (no se permite vaciar)
  if ('nombreComercial' in data && !data.nombreComercial) {
    delete data.nombreComercial
  }
  if ('logo' in data && !data.logo) {
    delete data.logo
  }
  if ('ciudad' in data && !data.ciudad) {
    delete data.ciudad
  }
  if ('provincia' in data && !data.provincia) {
    delete data.provincia
  }

  const updated = await prisma.dealer.update({
    where: { id: auth.dealerId },
    data,
  })
  return NextResponse.json({ ok: true, dealer: updated })
}
