import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/emails'
import crypto from 'crypto'

// Rate limit en memoria: 1 reenvío cada 60s por email
const lastSent = new Map<string, number>()
const COOLDOWN_MS = 60 * 1000

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const email = session.user.email

    // Cooldown
    const last = lastSent.get(email)
    if (last && Date.now() - last < COOLDOWN_MS) {
      const segundos = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000)
      return NextResponse.json({ error: 'Espera ' + segundos + ' segundos antes de reintentar', cooldown: segundos }, { status: 429 })
    }

    // Traer usuario
    const rows = await prisma.$queryRawUnsafe(
      'SELECT id, email, name, emailVerified FROM User WHERE email = ? LIMIT 1',
      email
    ) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const user = rows[0]

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Tu correo ya está verificado' }, { status: 400 })
    }

    // Generar token nuevo, válido 24h
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$executeRawUnsafe(
      'UPDATE User SET emailVerifyToken = ?, emailVerifyExpires = ? WHERE id = ?',
      token, expires, user.id
    )

    await sendVerificationEmail(user.email, user.name || 'Usuario', token)

    lastSent.set(email, Date.now())

    return NextResponse.json({ ok: true, message: 'Email reenviado. Revisa tu bandeja de entrada.' })
  } catch (e) {
    console.error('Resend verification error:', e)
    return NextResponse.json({ error: 'Error al reenviar el email' }, { status: 500 })
  }
}
