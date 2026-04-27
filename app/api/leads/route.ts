import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PHONE_REGEX = /^(\+593|0)[9]\d{8}$/

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
  const nombre = String(body.nombre || '').trim()
  const telefono = String(body.telefono || '').trim()
  const ciudad = body.ciudad ? String(body.ciudad).trim() : null
  const financiamiento = !!body.interesadoFinanciamiento
  const listingId = body.listingId ? String(body.listingId) : null
  const listingOwnerType = body.listingOwnerType === 'dealer' ? 'dealer' : 'user'
  const listingOwnerId = body.listingOwnerId ? String(body.listingOwnerId) : null
  const dealerId = body.dealerId ? String(body.dealerId) : null
  const tipo = String(body.tipo || 'whatsapp')

  if (nombre.length < 2) return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 })
  if (!PHONE_REGEX.test(telefono)) return NextResponse.json({ error: 'Telefono invalido' }, { status: 400 })
  if (!listingOwnerId) return NextResponse.json({ error: 'Falta listingOwnerId' }, { status: 400 })

  const session = await getServerSession(authOptions)
  let userId: string | null = null
  if (session?.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    userId = u?.id ?? null
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  const lead = await prisma.lead.create({
    data: {
      userId,
      nombre,
      telefono,
      ciudad,
      interesadoFinanciamiento: financiamiento,
      listingId,
      listingOwnerType,
      listingOwnerId,
      dealerId,
      tipo,
      userAgent,
      ipHash: hashIp(ip),
    },
    select: { id: true, createdAt: true },
  })
  return NextResponse.json({ ok: true, lead })
}
