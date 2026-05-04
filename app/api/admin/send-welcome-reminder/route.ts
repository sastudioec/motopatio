import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendWelcomeReminderEmail } from '@/lib/emails'

/**
 * POST /api/admin/send-welcome-reminder
 *
 * Envia el recordatorio retroactivamente a usuarios viejos identificados
 * por email (los que se registraron antes de que existiera el cron y por
 * tanto cayeron fuera de la ventana 24-48h o 7d-8d). Skipea silenciosamente
 * a quien ya recibio el correo del tipo correspondiente o ya tiene algun
 * Listing publicado (estado != 'borrador'). Marca el flag tras enviar
 * para que el cron diario no duplique.
 *
 * Body: { emails: string[], type?: '24h' | '7d' }
 *   - type default: '24h'  (controla cual flag se chequea/marca)
 * Response: { sent: string[], skipped: { email, reason }[], notFound: string[] }
 */
type ReminderType = '24h' | '7d'

const FLAG_BY_TYPE = {
  '24h': 'welcomeReminderSentAt',
  '7d': 'welcomeReminder7dSentAt',
} as const satisfies Record<ReminderType, 'welcomeReminderSentAt' | 'welcomeReminder7dSentAt'>

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { emails?: unknown; type?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return NextResponse.json(
      { error: 'emails requerido (array no vacio)' },
      { status: 400 }
    )
  }
  const emails = body.emails
    .filter((e): e is string => typeof e === 'string')
    .map((e) => e.toLowerCase().trim())
    .filter((e) => e.length > 0)
  if (emails.length === 0) {
    return NextResponse.json(
      { error: 'emails debe ser array de strings no vacios' },
      { status: 400 }
    )
  }

  const type: ReminderType =
    body.type === '7d' ? '7d' : body.type === '24h' || body.type === undefined ? '24h' : '24h'
  if (body.type !== undefined && body.type !== '24h' && body.type !== '7d') {
    return NextResponse.json(
      { error: "type debe ser '24h' o '7d'" },
      { status: 400 }
    )
  }
  const flagField = FLAG_BY_TYPE[type]

  const sent: string[] = []
  const skipped: { email: string; reason: string }[] = []
  const notFound: string[] = []

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        welcomeReminderSentAt: true,
        welcomeReminder7dSentAt: true,
        listings: {
          where: { estado: { not: 'borrador' } },
          select: { id: true },
          take: 1,
        },
      },
    })
    if (!user) {
      notFound.push(email)
      continue
    }
    const yaEnviado =
      type === '24h' ? user.welcomeReminderSentAt : user.welcomeReminder7dSentAt
    if (yaEnviado) {
      skipped.push({ email, reason: 'ya recibio el recordatorio ' + type })
      continue
    }
    if (user.listings.length > 0) {
      skipped.push({ email, reason: 'ya tiene listing publicado' })
      continue
    }
    try {
      await sendWelcomeReminderEmail(user.email, user.name || '')
      await prisma.user.update({
        where: { id: user.id },
        data: { [flagField]: new Date() },
      })
      sent.push(email)
      console.log('[admin-welcome-reminder ' + type + '] enviado', user.id, email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      skipped.push({ email, reason: 'error envio: ' + msg })
      console.error('[admin-welcome-reminder ' + type + '] error', email, msg)
    }
  }

  return NextResponse.json({ sent, skipped, notFound, type })
}
