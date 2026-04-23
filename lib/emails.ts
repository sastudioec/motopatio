import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
const BASE = 'https://motopatio.com'

function wrap(body: string): string {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;"><tr><td style="background:#1a1f36;padding:20px 40px;text-align:center;"><img src="https://motopatio.com/logo-blanco-moto-patio.png" alt="MotoPatio" height="40" style="display:block;margin:0 auto;" /></td></tr><tr><td style="padding:40px;">' + body + '</td></tr><tr><td style="padding:16px 40px 28px;border-top:1px solid #f4f4f5;text-align:center;"><p style="margin:0;font-size:12px;color:#a1a1aa;">MotoPatio · Ecuador · <a href="' + BASE + '" style="color:#e8572a;text-decoration:none;">motopatio.com</a> · <a href="' + BASE + '/terminos" style="color:#a1a1aa;text-decoration:none;">Términos</a></p></td></tr></table></td></tr></table></body></html>'
}

function btn(href: string, label: string): string {
  return '<div style="text-align:center;margin-top:24px;"><a href="' + href + '" style="display:inline-block;background:#e8572a;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">' + label + '</a></div>'
}

export async function sendWelcomeEmail(to: string, name: string) {
  const n = name.split(' ')[0]
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;text-align:center;">' +
    '&#x1F3CD; &iexcl;Bienvenido a MotoPatio, ' + n + '!</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;text-align:center;margin:0 0 20px;">' +
    'Tu correo fue verificado. Ya eres parte del patio de motos digital del Ecuador.</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:20px;margin:0 0 20px;">' +
    '<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1f36;">Ahora puedes:</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; Publicar tu moto y llegar a miles de compradores</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; Buscar motos en todo el Ecuador</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; Contactar directamente con vendedores</p>' +
    '<p style="margin:0;font-size:14px;color:#3f3f46;">&#10003; Destacar tu anuncio para vender mas rapido</p>' +
    '</div>' +
    btn(BASE + '/publicar', 'Publicar mi moto ahora')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Bienvenido a MotoPatio, ' + n + '! Tu cuenta esta lista',
    html: wrap(body)
  })
}
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const n = name.split(' ')[0]
  const link = BASE + '/api/auth/verify-email?token=' + token
  const body = '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Confirma tu correo electrónico</h2><p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, haz clic para verificar tu cuenta. Expira en <strong>24 horas</strong>.</p>' + btn(link, 'Verificar mi correo') + '<p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">Si no creaste esta cuenta, ignora este mensaje.</p>'
  return resend.emails.send({ from: 'MotoPatio <noreply@motopatio.com>', to, subject: 'Confirma tu correo en MotoPatio', html: wrap(body) })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const n = (name || '').split(' ')[0] || 'hola'
  const link = BASE + '/auth/reset-password?token=' + token
  const body = '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Restablece tu contraseña</h2><p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para elegir una nueva. El enlace expira en <strong>1 hora</strong>.</p>' + btn(link, 'Restablecer contraseña') + '<p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">Si no solicitaste este cambio, ignora este mensaje y tu contraseña seguirá igual.</p>'
  return resend.emails.send({ from: 'MotoPatio <noreply@motopatio.com>', to, subject: 'Restablece tu contraseña en MotoPatio', html: wrap(body) })
}

export async function sendPagoNoCompletadoEmail(
  to: string,
  name: string,
  info: { titulo: string; motivo: 'cancelled' | 'rejected'; paymentId: string }
) {
  const n = (name || '').split(' ')[0] || 'hola'
  const mensaje =
    info.motivo === 'cancelled'
      ? 'Cancelaste el pago antes de finalizar. No se realizó ningún cargo.'
      : 'Tu banco rechazó la transacción. No se realizó ningún cargo.'
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Tu pago no se completó</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, ' + mensaje + ' Tu anuncio quedó guardado y puedes reintentar cuando quieras.</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Anuncio sin publicar</p>' +
    '<p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + info.titulo + '</p>' +
    '</div>' +
    btn(BASE + '/publicar?retry=' + info.paymentId, 'Intentar de nuevo')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Tu pago en MotoPatio no se completó',
    html: wrap(body),
  })
}

export async function sendDestacadoActivadoEmail(
  to: string,
  name: string,
  info: { titulo: string; slug: string; destacadoHasta: Date }
) {
  const n = (name || '').split(' ')[0] || 'hola'
  const fecha = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(info.destacadoHasta)
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">⭐ Tu moto está destacada</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, tu anuncio aparece primero en el catálogo y en la sección "Clasificado Destacado" del home.</p>' +
    '<div style="background:#fff4e6;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Destacado hasta</p>' +
    '<p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + info.titulo + '</p>' +
    '<p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#e8572a;">' + fecha + '</p>' +
    '</div>' +
    btn(BASE + '/motos/' + info.slug, 'Ver mi anuncio')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Tu moto está destacada en MotoPatio ⭐',
    html: wrap(body),
  })
}

export async function sendMotoPublicadaEmail(to: string, name: string, moto: { titulo: string; slug: string; publicId: string; precio: number }) {
  const n = name.split(' ')[0]
  const precio = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(moto.precio)
  const body = '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">¡Tu moto está publicada!</h2><p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, tu anuncio ya está visible en Ecuador.</p><div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Tu anuncio</p><p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + moto.titulo + '</p><p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#e8572a;">' + precio + '</p><p style="margin:12px 0 0;font-size:13px;color:#52525b;">Tu código de referencia: <strong style="font-family:monospace;color:#1a1f36;letter-spacing:0.5px;">' + moto.publicId + '</strong></p><p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Úsalo cuando nos escribas por WhatsApp para soporte.</p></div>' + btn(BASE + '/motos/' + moto.slug, 'Ver mi anuncio')
  return resend.emails.send({ from: 'MotoPatio <noreply@motopatio.com>', to, subject: 'Tu moto "' + moto.titulo + '" ya está publicada ✅', html: wrap(body) })
}
