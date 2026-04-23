import type { Metadata } from 'next'
import PreciosClient from './PreciosClient'

export const metadata: Metadata = {
  title: 'Planes y precios para publicar tu moto en Ecuador',
  description:
    'Planes para publicar tu moto en Ecuador: Gratis, Básico ($5, 15 días) y Full ($10, 30 días con destacado). Precios únicos, sin suscripciones.',
  keywords: [
    'planes publicar moto',
    'precios publicación motos Ecuador',
    'anunciar moto Ecuador',
    'vender moto online',
    'clasificados motos Ecuador',
    'publicar moto gratis',
  ],
  alternates: { canonical: 'https://motopatio.com/precios' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/precios',
    title: 'Planes y precios | MotoPatío',
    description:
      'Planes para publicar tu moto en Ecuador: Gratis, Básico $5 y Full $10. Precios únicos, sin suscripciones.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Planes y precios' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y precios | MotoPatío',
    description: 'Publica tu moto en Ecuador. Planes Gratis, Básico $5 y Full $10.',
    images: ['/og-default.jpg'],
  },
}

export default function PreciosPage() {
  return <PreciosClient />
}
