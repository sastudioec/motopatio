import type { Metadata } from 'next'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(/\/$/, '')

const TITLE = 'Motos en venta en Ecuador | MotoPatío'
const DESC = 'Compra y venta de motos usadas y nuevas en Ecuador. Encuentra motocicletas en Quito, Guayaquil, Cuenca y todo el país. Publica tu moto gratis en MotoPatío.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}/motos` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${BASE}/motos`,
    siteName: 'MotoPatío',
    locale: 'es_EC',
    type: 'website',
    images: [{ url: `${BASE}/motopatio-logo.png`, width: 1200, height: 630, alt: 'MotoPatío' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: [`${BASE}/motopatio-logo.png`],
  },
}

export default function MotosLayout({ children }: { children: React.ReactNode }) {
  return children
}
