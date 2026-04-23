import type { Metadata } from 'next'
import RegistroClient from './RegistroClient'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta gratis en MotoPatío y publica tu moto en Ecuador.',
  robots: { index: false, follow: true },
}

export default function RegistroPage() {
  return <RegistroClient />
}
