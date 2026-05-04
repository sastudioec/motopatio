import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeReminderEmail } from '@/lib/emails'

/**
 * GET /api/cron/welcome-reminder
 *
 * Cron diario (03:00 UTC = 22:00 EC). Dos pasadas con el mismo correo
 * "te ayudamos a publicar?":
 *   - Pasada 24h: usuarios registrados entre 24h y 48h atras, sin Listing
 *     publicado, welcomeReminderSentAt == null. Atrapa a todos los que se
 *     registraron "ayer".
 *   - Pasada 7d:  usuarios registrados entre 7d y 8d atras, sin Listing
 *     publicado, welcomeReminder7dSentAt == null. Atrapa a todos los que
 *     se registraron "hace una semana".
 *
 * Listing en estado 'borrador' NO descalifica (quien guardo borrador y
 * abandono igual recibe el correo). Idempotente por flag por pasada.
 *
 * Auth: Bearer CRON_SECRET. No exponer publicamente.
 */
type Candidato = { id: string; email: string | null; name: string | null }

async function enviarPasada(
  label: '24h' | '7d',
  candidatos: Candidato[],
  flagField: 'welcomeReminderSentAt' | 'welcomeReminder7dSentAt'
) {
  const errores: { userId: string; error: string }[] = []
  let enviados = 0
  for (const u of candidatos) {
    if (!u.email) {
      errores.push({ userId: u.id, error: 'sin email' })
      console.error('[cron-welcome-reminder ' + label + '] sin email', u.id)
      continue
    }
    try {
      await sendWelcomeReminderEmail(u.email, u.name || '')
      await prisma.user.update({
        where: { id: u.id },
        data: { [flagField]: new Date() },
      })
      enviados++
      console.log('[cron-welcome-reminder ' + label + '] enviado', u.id, u.email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errores.push({ userId: u.id, error: msg })
      console.error('[cron-welcome-reminder ' + label + '] error', u.id, msg)
    }
  }
  return { procesados: candidatos.length, enviados, errores }
}

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
  const DAY_MS = 24 * HOUR_MS
  const now = Date.now()

  // Ventana 24h: registrados entre 24h y 48h atras
  const start24 = new Date(now - 48 * HOUR_MS)
  const end24 = new Date(now - 24 * HOUR_MS)
  const candidatos24 = await prisma.user.findMany({
    where: {
      createdAt: { gte: start24, lt: end24 },
      welcomeReminderSentAt: null,
      listings: { none: { estado: { not: 'borrador' } } },
    },
    select: { id: true, email: true, name: true },
  })
  console.log(
    '[cron-welcome-reminder 24h] inicio',
    'rango=' + start24.toISOString() + '..' + end24.toISOString(),
    'candidatos=' + candidatos24.length
  )
  const resultado24 = await enviarPasada('24h', candidatos24, 'welcomeReminderSentAt')
  console.log(
    '[cron-welcome-reminder 24h] fin',
    'enviados=' + resultado24.enviados,
    'errores=' + resultado24.errores.length
  )

  // Ventana 7d: registrados entre 7d y 8d atras
  const start7d = new Date(now - 8 * DAY_MS)
  const end7d = new Date(now - 7 * DAY_MS)
  const candidatos7d = await prisma.user.findMany({
    where: {
      createdAt: { gte: start7d, lt: end7d },
      welcomeReminder7dSentAt: null,
      listings: { none: { estado: { not: 'borrador' } } },
    },
    select: { id: true, email: true, name: true },
  })
  console.log(
    '[cron-welcome-reminder 7d] inicio',
    'rango=' + start7d.toISOString() + '..' + end7d.toISOString(),
    'candidatos=' + candidatos7d.length
  )
  const resultado7d = await enviarPasada('7d', candidatos7d, 'welcomeReminder7dSentAt')
  console.log(
    '[cron-welcome-reminder 7d] fin',
    'enviados=' + resultado7d.enviados,
    'errores=' + resultado7d.errores.length
  )

  return NextResponse.json({
    pasada24h: resultado24,
    pasada7d: resultado7d,
  })
}
