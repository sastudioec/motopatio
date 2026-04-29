import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/emails'

// Genera un token de reseteo, lo persiste sobre el usuario y dispara el email.
// El campo passwordResetToken es @unique, así que asignar uno nuevo invalida
// implícitamente cualquier token previo del mismo usuario.
//
// El email se envía con catch interno: si Resend falla, loggeamos pero no
// rompemos el flujo (el frontend muestra mensaje genérico igual).
export async function issuePasswordResetToken(params: {
  userId: string
  email: string
  name: string | null
  ttlMinutes: number
}): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + params.ttlMinutes * 60 * 1000)
  await prisma.user.update({
    where: { id: params.userId },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  })
  try {
    await sendPasswordResetEmail(params.email, params.name || '', token)
  } catch (e) {
    console.error('Error enviando correo de reset:', e)
  }
  return { token, expires }
}
