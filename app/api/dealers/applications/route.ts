import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  sendDealerApplicationAdminNotification,
  sendDealerApplicationConfirmation,
} from '@/lib/emails'

const STOCK_RANGES = ['1-10', '11-30', '31-50', '50+'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const E164_RE = /^\+[1-9]\d{6,14}$/

function trimStr(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t) return null
  return t.slice(0, max)
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const businessName = trimStr(body?.businessName, 200)
  const contactName = trimStr(body?.contactName, 200)
  const email = trimStr(body?.email, 200)
  const phone = trimStr(body?.phone, 32)
  const city = trimStr(body?.city, 120)
  const stockRange = trimStr(body?.stockRange, 16)
  const message = trimStr(body?.message, 2000)

  if (!businessName) return NextResponse.json({ error: 'Falta el nombre del concesionario' }, { status: 400 })
  if (!contactName) return NextResponse.json({ error: 'Falta el nombre de contacto' }, { status: 400 })
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (!phone || !E164_RE.test(phone)) return NextResponse.json({ error: 'Teléfono inválido (formato internacional)' }, { status: 400 })
  if (!city) return NextResponse.json({ error: 'Falta la ciudad' }, { status: 400 })
  if (!stockRange || !STOCK_RANGES.includes(stockRange as any)) {
    return NextResponse.json({ error: 'Rango de stock inválido' }, { status: 400 })
  }

  const application = await prisma.dealerApplication.create({
    data: {
      businessName,
      contactName,
      email: email.toLowerCase(),
      phone,
      city,
      stockRange,
      message: message || null,
      status: 'pending',
    },
  })

  // Disparamos ambos correos en paralelo sin bloquear la respuesta. Usamos
  // allSettled para que el fallo de uno no afecte al otro y registramos cada
  // error de forma independiente.
  Promise.allSettled([
    sendDealerApplicationAdminNotification({
      businessName: application.businessName,
      contactName: application.contactName,
      email: application.email,
      phone: application.phone,
      city: application.city,
      stockRange: application.stockRange,
      message: application.message,
    }),
    sendDealerApplicationConfirmation({
      email: application.email,
      contactName: application.contactName,
      businessName: application.businessName,
    }),
  ]).then((results) => {
    if (results[0].status === 'rejected') {
      console.error('[dealer-application] admin notification failed', application.id, results[0].reason)
    }
    if (results[1].status === 'rejected') {
      console.error('[dealer-application] applicant confirmation failed', application.id, results[1].reason)
    }
  })

  return NextResponse.json({ ok: true, id: application.id })
}
