import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { issuePasswordResetToken } from '@/lib/password-reset'

const GENERIC_OK = { message: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.' }

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && user.password) {
      await issuePasswordResetToken({
        userId: user.id,
        email,
        name: user.name,
        ttlMinutes: 60,
      })
    }
    return NextResponse.json(GENERIC_OK)
  } catch (error) {
    console.error('Error forgot-password:', error)
    return NextResponse.json(GENERIC_OK)
  }
}
