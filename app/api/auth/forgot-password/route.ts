import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/emails'

const GENERIC_OK = { message: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.' }

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && user.password) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 60 * 60 * 1000)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpires: expires },
      })
      try {
        await sendPasswordResetEmail(email, user.name || '', token)
      } catch (e) {
        console.error('Error enviando correo de reset:', e)
      }
    }
    return NextResponse.json(GENERIC_OK)
  } catch (error) {
    console.error('Error forgot-password:', error)
    return NextResponse.json(GENERIC_OK)
  }
}
