import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPhonePendingFinalReminderEmail } from '@/lib/emails'

/**
 * GET /api/cron/phone-reminder-final
 *
 * Cron horario. Segundo y ultimo recordatorio para usuarios que publicaron
 * sin telefono y no lo agregaron en 48h. El primer recordatorio se envia en
 * caliente al publicar (ver lib/phone-reminder.ts) y stampa
 * `phoneReminderSentAt`. Este job busca:
 *   - phoneReminderSentAt entre 48h y 72h atras
 *   - phone IS NULL (o vacio) — si ya lo agregaron, no enviamos
 *   - phoneReminderFinalSentAt IS NULL — idempotente
 *   - tiene al menos un Listing en estado 'activo'
 *
 * La ventana 48-72h da margen de hasta 24h de reintentos si Resend falla en
 * alguna corrida horaria.
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
  const end = new Date(now - 48 * HOUR_MS)

  const candidatos = await prisma.user.findMany({
    where: {
      phoneReminderSentAt: { gte: start, lt: end },
      phoneReminderFinalSentAt: null,
      OR: [{ phone: null }, { phone: '' }],
      listings: { some: { estado: 'activo' } },
    },
    select: {
      id: true, email: true, name: true,
      listings: {
        where: { estado: 'activo' },
        select: { marca: true, modelo: true, slug: true, id: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  console.log(
    '[cron-phone-reminder-final] inicio',
    'rango=' + start.toISOString() + '..' + end.toISOString(),
    'candidatos=' + candidatos.length
  )

  const errores: { userId: string; error: string }[] = []
  let enviados = 0

  for (const u of candidatos) {
    if (!u.email) {
      errores.push({ userId: u.id, error: 'sin email' })
      console.error('[cron-phone-reminder-final] sin email', u.id)
      continue
    }
    const moto = u.listings[0]
    if (!moto) {
      errores.push({ userId: u.id, error: 'sin listing activo' })
      console.error('[cron-phone-reminder-final] sin listing activo', u.id)
      continue
    }
    try {
      await sendPhonePendingFinalReminderEmail(u.email, u.name || 'hola', {
        titulo: moto.marca + ' ' + moto.modelo,
        slug: moto.slug || moto.id,
      })
      await prisma.user.update({
        where: { id: u.id },
        data: { phoneReminderFinalSentAt: new Date() },
      })
      enviados++
      console.log('[cron-phone-reminder-final] enviado', u.id, u.email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errores.push({ userId: u.id, error: msg })
      console.error('[cron-phone-reminder-final] error', u.id, msg)
    }
  }

  console.log(
    '[cron-phone-reminder-final] fin',
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
