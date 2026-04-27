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
  info: { titulo: string; motivo: 'cancelled' | 'rejected'; paymentId: string; concept: 'plan' | 'featured' | 'upgrade' }
) {
  const n = (name || '').split(' ')[0] || 'hola'
  const mensaje =
    info.motivo === 'cancelled'
      ? 'Cancelaste el pago antes de finalizar. No se realizó ningún cargo.'
      : 'Tu banco rechazó la transacción. No se realizó ningún cargo.'
  const enMisMotos = info.concept === 'featured' || info.concept === 'upgrade'
  const ctaPath = enMisMotos ? '/mis-motos?retry=' : '/publicar?retry='
  const tagline =
    info.concept === 'featured'
      ? 'Destacado no activado'
      : info.concept === 'upgrade'
        ? 'Plan sin mejorar'
        : 'Anuncio sin publicar'
  const contexto =
    info.concept === 'featured'
      ? ' Tu anuncio sigue activo; puedes reintentar el destacado cuando quieras.'
      : info.concept === 'upgrade'
        ? ' Tu anuncio sigue activo con el plan actual; puedes reintentar la mejora cuando quieras.'
        : ' Tu anuncio quedó guardado y puedes reintentar cuando quieras.'
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Tu pago no se completó</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, ' + mensaje + contexto + '</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">' + tagline + '</p>' +
    '<p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + info.titulo + '</p>' +
    '</div>' +
    btn(BASE + ctaPath + info.paymentId, 'Intentar de nuevo')
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

export async function sendPlanMejoradoEmail(
  to: string,
  name: string,
  info: {
    titulo: string
    slug: string
    planName: string
    planId: string
    durationDays: number
    expiraEn: Date
    featuredUntil: Date | null
  }
) {
  const n = (name || '').split(' ')[0] || 'hola'
  const fechaExpira = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(info.expiraEn)
  const featuredLine = info.featuredUntil
    ? '<p style="margin:6px 0 0;font-size:13px;color:#52525b;">⭐ Destacado hasta <strong>' +
      new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).format(info.featuredUntil) +
      '</strong></p>'
    : ''
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">🚀 ¡Plan mejorado!</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, tu anuncio ahora es <strong>Plan ' + info.planName + '</strong>. El conteo arranca desde hoy con los días completos del plan nuevo.</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Tu anuncio</p>' +
    '<p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + info.titulo + '</p>' +
    '<p style="margin:10px 0 0;font-size:14px;color:#52525b;">Plan <strong>' + info.planName + '</strong> · ' + info.durationDays + ' días activos</p>' +
    '<p style="margin:4px 0 0;font-size:14px;color:#52525b;">Vence el <strong>' + fechaExpira + '</strong></p>' +
    featuredLine +
    '</div>' +
    btn(BASE + '/motos/' + info.slug, 'Ver mi anuncio')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Tu plan en MotoPatio fue mejorado a ' + info.planName + ' 🚀',
    html: wrap(body),
  })
}

export async function sendMotoPublicadaEmail(to: string, name: string, moto: { titulo: string; slug: string; publicId: string; precio: number }) {
  const n = name.split(' ')[0]
  const precio = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(moto.precio)
  const body = '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">¡Tu moto está publicada!</h2><p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, tu anuncio ya está visible en Ecuador.</p><div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;"><p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Tu anuncio</p><p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + moto.titulo + '</p><p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#e8572a;">' + precio + '</p><p style="margin:12px 0 0;font-size:13px;color:#52525b;">Tu código de referencia: <strong style="font-family:monospace;color:#1a1f36;letter-spacing:0.5px;">' + moto.publicId + '</strong></p><p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Úsalo cuando nos escribas por WhatsApp para soporte.</p></div>' + btn(BASE + '/motos/' + moto.slug, 'Ver mi anuncio')
  return resend.emails.send({ from: 'MotoPatio <noreply@motopatio.com>', to, subject: 'Tu moto "' + moto.titulo + '" ya está publicada ✅', html: wrap(body) })
}

export async function sendExpiracionAviso(opts: {
  to: string
  nombre: string
  tituloMoto: string
  expiraEn: Date
  listingId: string
}) {
  const n = (opts.nombre || '').split(' ')[0] || 'hola'
  const fecha = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(opts.expiraEn)
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">⏰ Tu moto expira pronto</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, tu publicación en MotoPatio expira en <strong>3 días</strong>. Renueva o vuelve a publicarla para que siga visible para los compradores.</p>' +
    '<div style="background:#fff4e6;border-radius:8px;padding:16px 20px;margin:16px 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Tu anuncio</p>' +
    '<p style="margin:0;font-size:17px;font-weight:700;color:#1a1f36;">' + opts.tituloMoto + '</p>' +
    '<p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#e8572a;">Expira el ' + fecha + '</p>' +
    '</div>' +
    btn(BASE + '/mis-motos#' + opts.listingId, 'Renovar mi anuncio')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to: opts.to,
    subject: 'Tu moto en MotoPatio expira en 3 días',
    html: wrap(body),
  })
}

/**
 * Confirmacion al usuario que llenó el form de contacto. El admin ya recibe
 * su propia notificacion via /api/contacto. Este email es secundario: si
 * falla, el caller solo loggea (no rompe la request).
 */
export async function sendContactoConfirmacion(opts: {
  to: string
  nombre: string
  asunto: string
  mensaje: string
}) {
  const n = (opts.nombre || '').split(' ')[0] || 'hola'
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  const asuntoTxt = opts.asunto && opts.asunto.trim() ? opts.asunto : '(sin asunto)'
  const mensajeHtml = escape(opts.mensaje).replace(/\n/g, '<br>')
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Recibimos tu mensaje</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Hola <strong>' + n + '</strong>, recibimos tu mensaje y queríamos confirmarte que ya está en nuestra bandeja. Te responderemos en un máximo de <strong>48 horas hábiles</strong> al correo desde el que escribiste.</p>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;">Mientras tanto, puedes revisar las preguntas más frecuentes en nuestro Centro de Ayuda — quizá ya tengas la respuesta sin esperar.</p>' +
    btn(BASE + '/ayuda', 'Ver Centro de Ayuda') +
    '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:24px 0 0;border-left:4px solid #e8572a;">' +
    '<p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Recap de tu mensaje</p>' +
    '<p style="margin:0 0 10px;font-size:14px;color:#3f3f46;"><strong>Asunto:</strong> ' + escape(asuntoTxt) + '</p>' +
    '<p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.6;">' + mensajeHtml + '</p>' +
    '</div>' +
    '<p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">Si no enviaste este mensaje, puedes ignorar este correo.</p>'
  return resend.emails.send({
    from: 'MotoPatío <noreply@motopatio.com>',
    to: opts.to,
    replyTo: 'info@motopatio.com',
    subject: 'Recibimos tu mensaje — MotoPatío',
    html: wrap(body),
  })
}

const ADMIN_EMAIL = 'info@motopatio.com'

export async function notifyAdmin(subject: string, body: string): Promise<void> {
  await resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to: ADMIN_EMAIL,
    subject,
    html: body,
  })
}

export async function sendDealerWelcomeEmail(
  to: string,
  info: { nombreComercial: string; slug: string; trialEndsAt: Date }
) {
  const fecha = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(info.trialEndsAt)
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;text-align:center;">' +
    '&#x1F3EA; Bienvenido a MotoPatio Dealers, ' + info.nombreComercial + '!</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;text-align:center;margin:0 0 20px;">' +
    'Tu concesionario quedo registrado. Estamos revisando tu documentacion para aprobar tu cuenta.</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:20px;margin:0 0 20px;">' +
    '<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1f36;">Tu prueba gratuita</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; 60 dias para probar el panel y publicar anuncios</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; Vence el <strong>' + fecha + '</strong></p>' +
    '<p style="margin:0;font-size:14px;color:#3f3f46;">&#10003; Antes de esa fecha te enviaremos los planes disponibles</p>' +
    '</div>' +
    '<p style="font-size:14px;color:#52525b;line-height:1.6;margin:0 0 16px;">' +
    'Tu perfil publico ya esta activo en <a href="' + BASE + '/dealers/' + info.slug + '" style="color:#e8572a;font-weight:700;">' + BASE + '/dealers/' + info.slug + '</a>. Cierra sesion y vuelve a entrar para ver el panel "Mi Tienda".</p>' +
    btn(BASE + '/mi-tienda', 'Ir al panel')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Bienvenido a MotoPatio Dealers, ' + info.nombreComercial,
    html: wrap(body),
  })
}

export async function sendDealerApprovedEmail(
  to: string,
  info: { nombreComercial: string; slug: string; listingsCount?: number }
) {
  const count = info.listingsCount ?? 0
  const motosBlock = count > 0
    ? '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">' +
      '<p style="margin:0;font-size:14px;color:#3f3f46;">&#10003; <strong>' + count + '</strong> ' +
      (count === 1 ? 'moto que tenias cargada ya esta publica' : 'motos que tenias cargadas ya estan publicas') + ' en MotoPatio.</p>' +
      '</div>'
    : ''
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;text-align:center;">' +
    '&#x2705; Tu concesionario fue aprobado</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;text-align:center;margin:0 0 16px;">' +
    '&iexcl;Felicitaciones, ' + info.nombreComercial + '! Tu cuenta esta aprobada y tu perfil publico ya esta activo.</p>' +
    motosBlock +
    btn(BASE + '/dealers/' + info.slug, 'Ver mi perfil publico')
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Tu concesionario fue aprobado en MotoPatio',
    html: wrap(body),
  })
}

export async function sendDealerRejectedEmail(
  to: string,
  info: { nombreComercial: string }
) {
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;text-align:center;">' +
    'Sobre tu solicitud en MotoPatio</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 16px;">' +
    'Hola ' + info.nombreComercial + ', tu cuenta no pudo ser aprobada en este momento.</p>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 16px;">' +
    'Contactanos a <a href="mailto:info@motopatio.com" style="color:#e8572a;font-weight:700;">info@motopatio.com</a> para mas informacion sobre los pasos a seguir.</p>'
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Sobre tu solicitud en MotoPatio',
    html: wrap(body),
  })
}

export async function sendDealerApplicationAdminNotification(data: {
  businessName: string
  contactName: string
  email: string
  phone: string
  city: string
  stockRange: string
  message: string | null
}) {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  const row = (label: string, value: string) =>
    '<tr><td style="padding:8px 0;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;width:140px;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:8px 0;font-size:14px;color:#1a1f36;font-weight:600;">' + value + '</td></tr>'
  const mensajeBlock = data.message && data.message.trim()
    ? '<div style="background:#f9f9fb;border-radius:8px;padding:16px 20px;margin:20px 0 0;border-left:4px solid #e8572a;">' +
      '<p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;font-weight:600;text-transform:uppercase;">Mensaje del solicitante</p>' +
      '<p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.6;">' + escape(data.message).replace(/\n/g, '<br>') + '</p>' +
      '</div>'
    : ''
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Nueva solicitud de concesionario</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 20px;">Llegó una solicitud nueva desde el formulario de <strong>/dealers/programa</strong>.</p>' +
    '<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f9f9fb;border-radius:8px;padding:8px 16px;">' +
    row('Negocio', escape(data.businessName)) +
    row('Contacto', escape(data.contactName)) +
    row('Email', '<a href="mailto:' + escape(data.email) + '" style="color:#e8572a;text-decoration:none;font-weight:700;">' + escape(data.email) + '</a>') +
    row('Teléfono', '<a href="https://wa.me/' + escape(data.phone.replace(/[^\d]/g, '')) + '" style="color:#e8572a;text-decoration:none;font-weight:700;">' + escape(data.phone) + '</a>') +
    row('Ciudad', escape(data.city)) +
    row('Stock aprox.', escape(data.stockRange)) +
    '</table>' +
    mensajeBlock
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: 'Nueva solicitud de concesionario — ' + data.businessName,
    html: wrap(body),
  })
}

export async function sendDealerInvitationEmail(to: string) {
  const waNumber = process.env.GABRIELA_WHATSAPP || '+593 XXX XXX XXX'
  const waDigits = waNumber.replace(/[^\d]/g, '')
  const waLink = waDigits ? 'https://wa.me/' + waDigits : ''
  const waLine = waLink
    ? 'Si prefieres hablar directo, escríbeme por WhatsApp al <a href="' + waLink + '" style="color:#e8572a;font-weight:700;text-decoration:none;">' + waNumber + '</a>.'
    : 'Si prefieres hablar directo, escríbeme por WhatsApp al <strong>' + waNumber + '</strong>.'
  const item = (txt: string) =>
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">&#10003; ' + txt + '</p>'
  const body =
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">Hola,</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">Soy <strong>Gabriela</strong>, del equipo de Moto Patio.</p>' +
    '<div style="text-align:center;margin:0 0 24px;padding:24px 16px;background:#fff5f0;border-radius:12px;border:2px dashed #e8572a;">' +
    '<p style="margin:0;font-size:24px;font-weight:800;color:#e8572a;line-height:1.25;">Publica las motos de tu concesionario <span style="text-transform:uppercase;">GRATIS</span> por 60 días.</p>' +
    '</div>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 20px;">Estamos eligiendo a los primeros concesionarios del Ecuador para inaugurar nuestro programa de lanzamiento, y queremos que seas parte.</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:20px;margin:0 0 20px;">' +
    '<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1a1f36;">El programa incluye:</p>' +
    item('60 días gratis') +
    item('Hasta 20 motos publicadas') +
    item('Tu perfil propio en motopatio.com') +
    item('Control de leads exportable') +
    item('Historial completo de tu inventario') +
    '</div>' +
    btn(BASE + '/dealers/programa', 'Ver el programa') +
    '<p style="font-size:14px;color:#52525b;line-height:1.6;margin:24px 0 0;">' + waLine + '</p>' +
    '<p style="font-size:14px;color:#52525b;line-height:1.6;margin:24px 0 0;">Un saludo,<br><strong>Gabriela</strong><br>Moto Patio · <a href="' + BASE + '" style="color:#e8572a;font-weight:700;text-decoration:none;">motopatio.com</a></p>'
  return resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: 'Publica las motos de tu concesionario gratis en Moto Patio',
    html: wrap(body),
  })
}
