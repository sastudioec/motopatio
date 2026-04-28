import type { Metadata } from 'next'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(/\/$/, '')

const TITLE = 'Motos en venta en Ecuador: usadas, nuevas y concesionarios'
const SOCIAL_TITLE = `${TITLE} | MotoPatío`
const DESC = 'Encuentra motos en venta en todo Ecuador. Filtra por marca, ciudad, precio y kilometraje. Anuncios de particulares y concesionarios verificados.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}/motos` },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESC,
    url: `${BASE}/motos`,
    siteName: 'MotoPatío',
    locale: 'es_EC',
    type: 'website',
    images: [{ url: `${BASE}/motopatio-logo.png`, width: 1200, height: 630, alt: 'MotoPatío' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SOCIAL_TITLE,
    description: DESC,
    images: [`${BASE}/motopatio-logo.png`],
  },
}

export default function MotosLayout({ children }: { children: React.ReactNode }) {
  return children
}
