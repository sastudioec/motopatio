import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeReminderEmail } from '@/lib/emails'

/**
 * GET /api/cron/welcome-reminder
 *
 * Cron horario. Envia un recordatorio "te ayudamos a publicar?" a usuarios
 * que crearon cuenta entre 24h y 72h atras y todavia no tienen ningun
 * Listing publicado (cuenta cualquier estado != 'borrador'; quien guardo
 * borrador y abandono SI recibe el email). Idempotente por usuario: marca
 * welcomeReminderSentAt al enviar y solo procesa los que tienen ese campo
 * en NULL. La ventana ancha 24-72h da hasta dos dias de reintentos si Resend
 * falla en alguna corrida horaria.
 *
 * Auth: Bearer CRON_SECRET. No exponer publicamente.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado' },
      { status: 503 }
    )
  }

  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const HOUR_MS = 60 * 60 * 1000
  const now = Date.now()
  const start = new Date(now - 72 * HOUR_MS)
  const end = new Date(now - 24 * HOUR_MS)

  const candidatos = await prisma.user.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      welcomeReminderSentAt: null,
      listings: { none: { estado: { not: 'borrador' } } },
    },
    select: { id: true, email: true, name: true },
  })

  console.log(
    '[cron-welcome-reminder] inicio',
    'rango=' + start.toISOString() + '..' + end.toISOString(),
    'candidatos=' + candidatos.length
  )

  const errores: { userId: string; error: string }[] = []
  let enviados = 0

  for (const u of candidatos) {
    if (!u.email) {
      errores.push({ userId: u.id, error: 'sin email' })
      console.error('[cron-welcome-reminder] sin email', u.id)
      continue
    }
    try {
      await sendWelcomeReminderEmail(u.email, u.name || '')
      await prisma.user.update({
        where: { id: u.id },
        data: { welcomeReminderSentAt: new Date() },
      })
      enviados++
      console.log('[cron-welcome-reminder] enviado', u.id, u.email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errores.push({ userId: u.id, error: msg })
      console.error('[cron-welcome-reminder] error', u.id, msg)
    }
  }

  console.log(
    '[cron-welcome-reminder] fin',
    'procesados=' + candidatos.length,
    'enviados=' + enviados,
    'errores=' + errores.length
  )

  return NextResponse.json({
    procesados: candidatos.length,
    enviados,
    errores,
  })
}
