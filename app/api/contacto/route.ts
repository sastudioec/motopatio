import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE = 'https://motopatio.com'

// Rate limit en memoria (básico, por IP) — 3 mensajes cada 10 minutos
const rateStore = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3

function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function hitRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  if (entry.count > MAX_PER_WINDOW) return true
  return false
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req)
    if (hitRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados mensajes en poco tiempo. Inténtalo más tarde.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const nombre = String(body.nombre || '').trim().slice(0, 80)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 120)
    const asunto = String(body.asunto || '').trim().slice(0, 80)
    const mensaje = String(body.mensaje || '').trim().slice(0, 2000)
    const honeypot = String(body.website || '').trim()

    // Honeypot anti-bot: campo oculto "website" debe estar vacío
    if (honeypot.length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Validaciones
    if (nombre.length < 2) {
      return NextResponse.json({ error: 'Nombre demasiado corto' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }
    if (mensaje.length < 10) {
      return NextResponse.json({ error: 'Mensaje demasiado corto' }, { status: 400 })
    }

    const html =
      '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">' +
      '<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
      '<table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">' +
      '<tr><td style="background:#1a1f36;padding:20px 40px;text-align:center;"><img src="' +
      BASE +
      '/logo-blanco-moto-patio.png" alt="MotoPatio" height="40" /></td></tr>' +
      '<tr><td style="padding:32px 40px;">' +
      '<h2 style="margin:0 0 16px;color:#1a1f36;font-size:20px;">Nuevo mensaje del formulario de contacto</h2>' +
      '<p style="margin:0 0 8px;font-size:13px;color:#888;"><strong>Nombre:</strong> ' +
      escapeHtml(nombre) +
      '</p>' +
      '<p style="margin:0 0 8px;font-size:13px;color:#888;"><strong>Email:</strong> ' +
      escapeHtml(email) +
      '</p>' +
      '<p style="margin:0 0 8px;font-size:13px;color:#888;"><strong>Asunto:</strong> ' +
      escapeHtml(asunto || '(sin asunto)') +
      '</p>' +
      '<p style="margin:0 0 8px;font-size:13px;color:#888;"><strong>IP:</strong> ' +
      escapeHtml(ip) +
      '</p>' +
      '<div style="background:#f9f9fb;border-left:4px solid #e8572a;padding:16px;margin-top:16px;border-radius:4px;">' +
      '<p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap;">' +
      escapeHtml(mensaje) +
      '</p></div>' +
      '</td></tr></table></td></tr></table></body></html>'

    const result = await resend.emails.send({
      from: 'MotoPatio Contacto <noreply@motopatio.com>',
      to: 'info@motopatio.com',
      replyTo: email,
      subject: '[Contacto] ' + (asunto || 'Sin asunto') + ' — ' + nombre,
      html
    })

    if (result.error) {
      console.error('[contacto] Resend error:', result.error)
      return NextResponse.json(
        { error: 'No se pudo enviar el mensaje. Intenta más tarde.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[contacto] Error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
