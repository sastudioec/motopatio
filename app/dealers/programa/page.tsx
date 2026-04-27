import type { Metadata } from 'next'
import ProgramaClient from './ProgramaClient'

export const metadata: Metadata = {
  title: 'Programa de concesionarios — Moto Patio',
  description:
    'Estamos invitando a los primeros concesionarios del Ecuador a sumarse de forma gratuita: 60 días gratis, perfil propio en motopatio.com, captura de leads, métricas e historial completo de tu inventario.',
  alternates: { canonical: 'https://motopatio.com/dealers/programa' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/dealers/programa',
    title: 'Programa de concesionarios — Moto Patio',
    description:
      'Súmate a los primeros concesionarios del Ecuador en Moto Patio. 60 días gratis, perfil propio, captura de leads, métricas e historial completo.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Programa de concesionarios — Moto Patio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Programa de concesionarios — Moto Patio',
    description: '60 días gratis, perfil propio en motopatio.com, captura de leads y métricas.',
    images: ['/og-default.jpg'],
  },
}

export default function ProgramaPage() {
  return <ProgramaClient />
}
