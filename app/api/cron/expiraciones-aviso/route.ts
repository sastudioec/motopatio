import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendExpiracionAviso } from '@/lib/emails'

/**
 * GET /api/cron/expiraciones-aviso
 *
 * Cron diario 09:00 EC. Envia un aviso por email a usuarios cuyo Listing
 * activo expira dentro de 3 dias (ventana del dia EC completo, UTC-5).
 * Idempotente por listing: marca recordatorioExpiracionEnviadoAt al enviar
 * y solo procesa los que tienen ese campo en NULL. Si el envio falla NO se
 * marca, para reintentar en la siguiente corrida.
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

  // Ventana "expira en 3 dias", expresada como el dia EC completo
  // [hoy_EC + 3, hoy_EC + 4) traducido a instantes UTC. EC = UTC-5 sin DST.
  const EC_OFFSET_MS = 5 * 60 * 60 * 1000
  const DAY_MS = 24 * 60 * 60 * 1000
  const nowMs = Date.now()
  const startOfTodayEcUtcMs =
    Math.floor((nowMs - EC_OFFSET_MS) / DAY_MS) * DAY_MS + EC_OFFSET_MS
  const start = new Date(startOfTodayEcUtcMs + 3 * DAY_MS)
  const end = new Date(startOfTodayEcUtcMs + 4 * DAY_MS)

  const candidatos = await prisma.listing.findMany({
    where: {
      estado: 'activo',
      expiraEn: { gte: start, lt: end },
      recordatorioExpiracionEnviadoAt: null,
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  })

  console.log(
    '[cron-expiraciones] inicio',
    'rango=' + start.toISOString() + '..' + end.toISOString(),
    'candidatos=' + candidatos.length
  )

  const errores: { listingId: string; error: string }[] = []
  let enviados = 0

  for (const l of candidatos) {
    if (!l.user?.email || !l.expiraEn) {
      errores.push({ listingId: l.id, error: 'datos incompletos (email o expiraEn)' })
      console.error('[cron-expiraciones] datos incompletos', l.id)
      continue
    }
    const titulo = l.marca + ' ' + l.modelo + ' ' + l.anio
    try {
      await sendExpiracionAviso({
        to: l.user.email,
        nombre: l.user.name || '',
        tituloMoto: titulo,
        expiraEn: l.expiraEn,
        listingId: l.id,
      })
      await prisma.listing.update({
        where: { id: l.id },
        data: { recordatorioExpiracionEnviadoAt: new Date() },
      })
      enviados++
      console.log('[cron-expiraciones] enviado', l.id, l.user.email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errores.push({ listingId: l.id, error: msg })
      console.error('[cron-expiraciones] error', l.id, msg)
    }
  }

  console.log(
    '[cron-expiraciones] fin',
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
