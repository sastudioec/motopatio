import { prisma } from '@/lib/prisma'
import { sendPhonePendingReminderEmail } from '@/lib/emails'

/**
 * Si el usuario que acaba de publicar no tiene telefono en su perfil y nunca
 * recibio el primer recordatorio, le envia el email y stampa
 * `phoneReminderSentAt`. El segundo aviso (48h) lo dispara
 * `/api/cron/phone-reminder-final`.
 *
 * Idempotente: solo envia si `user.phone` es null/vacio Y
 * `phoneReminderSentAt` es null. No backfillea: si el campo ya tiene un
 * valor, no reenvia.
 *
 * Best-effort: errores no rompen el flujo de publicacion (se loguean).
 */
export async function maybeSendPhoneReminderOnPublish(
  userId: string,
  listing: { titulo: string; slug: string }
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, phone: true, phoneReminderSentAt: true },
    })
    if (!user || !user.email) return
    if (user.phone && user.phone.trim().length > 0) return
    if (user.phoneReminderSentAt) return

    await sendPhonePendingReminderEmail(user.email, user.name || 'hola', listing)
    await prisma.user.update({
      where: { id: userId },
      data: { phoneReminderSentAt: new Date() },
    })
    console.log('[phone-reminder] enviado userId=' + userId + ' email=' + user.email)
  } catch (e) {
    console.error('[phone-reminder] error userId=' + userId, e)
  }
}
