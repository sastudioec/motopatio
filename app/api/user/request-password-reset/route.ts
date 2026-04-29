import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issuePasswordResetToken } from '@/lib/password-reset'

const TTL_MINUTES = 15
// Si ya hay un token vigente con más de RESEND_THROTTLE_MIN minutos
// restantes, rechazamos para evitar spam de emails desde la sesión activa.
const RESEND_THROTTLE_MIN = 10

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, password: true, passwordResetExpires: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  if (!user.password) {
    return NextResponse.json(
      { error: 'Tu cuenta usa Google. La contraseña se gestiona desde Google.' },
      { status: 400 }
    )
  }
  if (user.passwordResetExpires) {
    const remainingMs = user.passwordResetExpires.getTime() - Date.now()
    if (remainingMs > RESEND_THROTTLE_MIN * 60 * 1000) {
      return NextResponse.json(
        { error: 'Ya enviamos un enlace recientemente. Revisa tu correo.' },
        { status: 429 }
      )
    }
  }
  await issuePasswordResetToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    ttlMinutes: TTL_MINUTES,
  })
  return NextResponse.json({ ok: true })
}
