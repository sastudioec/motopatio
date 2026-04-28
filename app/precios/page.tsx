import type { Metadata } from 'next'
import PreciosClient from './PreciosClient'

const TITLE = 'Publica tu moto en Ecuador, planes y precios'
const SOCIAL_TITLE = `${TITLE} | MotoPatío`
const DESC =
  'Publica tu moto en Ecuador y llega a miles de compradores. Plan gratis disponible. Pagos seguros con Payphone. Sin comisiones por venta.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
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
    title: SOCIAL_TITLE,
    description: DESC,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Planes y precios' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SOCIAL_TITLE,
    description: DESC,
    images: ['/og-default.jpg'],
  },
}

export default function PreciosPage() {
  return <PreciosClient />
}
