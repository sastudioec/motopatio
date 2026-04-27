/**
 * Envío manual del correo de invitación al programa de concesionarios.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/send-dealer-invitation.ts
 *
 * Toma el email del primer arg si se pasa, o el default hard-codeado.
 */
import { sendDealerInvitationEmail } from '@/lib/emails'

const DEFAULT_TO = 'santosalexecu@gmail.com'

async function main() {
  const to = process.argv[2] || DEFAULT_TO
  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en el entorno. Asegúrate de correr con --env-file=.env')
    process.exit(1)
  }
  console.log('→ Enviando invitación a:', to)
  console.log('→ GABRIELA_WHATSAPP:', process.env.GABRIELA_WHATSAPP || '(no configurado, se usará placeholder)')
  const res = await sendDealerInvitationEmail(to)
  console.log('✔ Resend response:', JSON.stringify(res, null, 2))
}

main().catch((e) => {
  console.error('✖ Error enviando correo:', e)
  process.exit(1)
})
