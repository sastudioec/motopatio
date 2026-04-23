import type { Metadata } from 'next'
import PublicarClient from './PublicarClient'

export const metadata: Metadata = {
  title: 'Publica tu moto en venta',
  description:
    'Publica tu moto en MotoPatío y llega a miles de compradores en Ecuador. Plan gratis disponible o planes pagados con más fotos y destacado.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://motopatio.com/publicar' },
}

export default function PublicarPage() {
  return <PublicarClient />
}
