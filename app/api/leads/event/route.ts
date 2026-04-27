import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = new Set([
  'whatsapp_button_clicked',
  'lead_modal_opened',
  'lead_form_submitted',
  'whatsapp_redirected',
])

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.NEXTAUTH_SECRET || 'mp-salt'
  return crypto.createHash('sha256').update(ip + ':' + salt).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }
  const type = String(body.type || '')
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  await prisma.leadEvent.create({
    data: {
      type,
      listingId: body.listingId ? String(body.listingId) : null,
      dealerId: body.dealerId ? String(body.dealerId) : null,
      leadId: body.leadId ? String(body.leadId) : null,
      userAgent,
      ipHash: hashIp(ip),
    },
  })
  return NextResponse.json({ ok: true })
}
