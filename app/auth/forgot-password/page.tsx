import type { Metadata } from 'next'
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
  description: 'Recupera el acceso a tu cuenta de MotoPatío.',
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
