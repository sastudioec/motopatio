/**
 * One-shot: envia un recordatorio a un usuario que publico su moto sin telefono
 * en el perfil, lo que impide que los compradores lo contacten.
 *
 * Uso:
 *   npx tsx scripts/send-add-phone-reminder.ts <to-email> <first-name> <listing-titulo> <listing-slug>
 *
 * Ejemplos:
 *   npx tsx scripts/send-add-phone-reminder.ts santosalexecu@gmail.com Jorge "Suzuki V-Strom 250 2019" suzuki-v-strom-250-2019-sangolqui-ruminahui-pbwnlt
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE = 'https://motopatio.com'

function wrap(body: string): string {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;"><tr><td style="background:#1a1f36;padding:20px 40px;text-align:center;"><img src="https://motopatio.com/logo-blanco-moto-patio.png" alt="MotoPatio" height="40" style="display:block;margin:0 auto;" /></td></tr><tr><td style="padding:40px;">' + body + '</td></tr><tr><td style="padding:16px 40px 28px;border-top:1px solid #f4f4f5;text-align:center;"><p style="margin:0;font-size:12px;color:#a1a1aa;">MotoPatio · Ecuador · <a href="' + BASE + '" style="color:#e8572a;text-decoration:none;">motopatio.com</a> · <a href="' + BASE + '/terminos" style="color:#a1a1aa;text-decoration:none;">Términos</a></p></td></tr></table></td></tr></table></body></html>'
}

function btn(href: string, label: string): string {
  return '<div style="text-align:center;margin-top:24px;"><a href="' + href + '" style="display:inline-block;background:#e8572a;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">' + label + '</a></div>'
}

async function main() {
  const [to, firstName, motoTitulo, motoSlug] = process.argv.slice(2)
  if (!to || !firstName || !motoTitulo || !motoSlug) {
    console.error('Uso: npx tsx scripts/send-add-phone-reminder.ts <to> <name> <titulo> <slug>')
    process.exit(1)
  }

  const motoUrl = BASE + '/motos/' + motoSlug

  const body =
    '<div style="text-align:center;margin:0 0 16px;">' +
    '<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Acción requerida</span>' +
    '</div>' +
    '<h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#1a1f36;text-align:center;line-height:1.3;">' +
    firstName + ', ¡no registraste tu teléfono!</h2>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 18px;text-align:center;">' +
    'Tu anuncio de la <strong>' + motoTitulo + '</strong> ya está publicado, pero <strong>nadie podrá contactarte</strong> hasta que agregues tu número.</p>' +
    '<div style="background:#fff8e6;border-left:4px solid #e8572a;border-radius:6px;padding:16px 20px;margin:0 0 22px;">' +
    '<p style="margin:0;font-size:14px;color:#1a1f36;line-height:1.6;">' +
    'Sin teléfono no aparece el botón de WhatsApp ni el de llamada en tu publicación. Los compradores interesados ven la moto pero no tienen forma de escribirte.</p>' +
    '</div>' +
    '<p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 12px;">' +
    '<strong>Soluciónalo ahora</strong> — toma menos de un minuto:</p>' +
    '<div style="background:#f9f9fb;border-radius:8px;padding:20px;margin:0 0 16px;">' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">1. Entra a tu perfil en MotoPatio</p>' +
    '<p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">2. Agrega tu número de teléfono (con código de país)</p>' +
    '<p style="margin:0;font-size:14px;color:#3f3f46;">3. Guarda los cambios — ¡listo!</p>' +
    '</div>' +
    btn(BASE + '/perfil', 'Agregar mi teléfono ahora') +
    '<p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;text-align:center;">' +
    'Revisa tu publicación: <a href="' + motoUrl + '" style="color:#e8572a;text-decoration:none;">' + motoTitulo + '</a></p>'

  const resp = await resend.emails.send({
    from: 'MotoPatio <noreply@motopatio.com>',
    to,
    subject: '⚠️ ' + firstName + ', no registraste tu teléfono — los compradores no pueden contactarte',
    html: wrap(body),
  })
  console.log('SENT:', JSON.stringify(resp, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
