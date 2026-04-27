/**
 * Envío manual del correo de bienvenida del dealer (post-onboarding).
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/send-dealer-welcome.ts
 *   npx tsx --env-file=.env scripts/send-dealer-welcome.ts otro@correo.com
 *
 * Toma el email del primer arg si se pasa, o el default hard-codeado.
 * trialEndsAt se calcula como hoy + 60 días.
 */
import { sendDealerWelcomeEmail } from '@/lib/emails'

const DEFAULT_TO = 'santosalexecu@gmail.com'

async function main() {
  const to = process.argv[2] || DEFAULT_TO
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el entorno. Asegúrate de correr con --env-file=.env')
    process.exit(1)
  }
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 60)
  console.log('→ Enviando welcome dealer a:', to)
  console.log('→ Trial vence:', trialEndsAt.toISOString())
  const res = await sendDealerWelcomeEmail(to, {
    nombreComercial: 'Moto Patio Test',
    slug: 'moto-patio-test',
    trialEndsAt,
  })
  console.log('✔ Resend response:', JSON.stringify(res, null, 2))
}

main().catch((e) => {
  console.error('✖ Error enviando correo:', e)
  process.exit(1)
})
