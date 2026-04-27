/**
 * Envío manual del correo de bienvenida del cliente particular
 * (post-verificación de email).
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/send-welcome.ts
 *   npx tsx --env-file=.env scripts/send-welcome.ts otro@correo.com "Nombre"
 *
 * Args:
 *   1: destinatario (default santosalexecu@gmail.com)
 *   2: nombre (default "Alex Santos")
 */
import { sendWelcomeEmail } from '@/lib/emails'

const DEFAULT_TO = 'santosalexecu@gmail.com'
const DEFAULT_NAME = 'Alex Santos'

async function main() {
  const to = process.argv[2] || DEFAULT_TO
  const name = process.argv[3] || DEFAULT_NAME
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el entorno. Asegúrate de correr con --env-file=.env')
    process.exit(1)
  }
  console.log('→ Enviando welcome cliente a:', to)
  console.log('→ Nombre:', name)
  const res = await sendWelcomeEmail(to, name)
  console.log('✔ Resend response:', JSON.stringify(res, null, 2))
}

main().catch((e) => {
  console.error('✖ Error enviando correo:', e)
  process.exit(1)
})
