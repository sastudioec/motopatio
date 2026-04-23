import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Ingresar',
  description: 'Ingresa a tu cuenta de MotoPatío para gestionar tus publicaciones.',
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return <LoginClient />
}
