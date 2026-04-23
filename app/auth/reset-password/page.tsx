import type { Metadata } from 'next'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  description: 'Define una nueva contraseña para tu cuenta de MotoPatío.',
  robots: { index: false, follow: true },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
