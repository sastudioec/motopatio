import type { Metadata } from 'next'
import ContactoClient from './ContactoClient'

export const metadata: Metadata = {
  title: 'Contacto y soporte',
  description:
    'Contáctanos por info@motopatio.com o por el formulario. Atendemos dudas de publicaciones, pagos y cuentas en Ecuador.',
  keywords: ['contacto motopatio', 'soporte motos Ecuador', 'info motopatio'],
  alternates: { canonical: 'https://motopatio.com/contacto' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/contacto',
    title: 'Contacto y soporte | MotoPatío',
    description: 'Atendemos dudas de publicaciones, pagos y cuentas. Escríbenos a info@motopatio.com.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Contacto' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto y soporte | MotoPatío',
    description: 'Escríbenos a info@motopatio.com.',
    images: ['/og-default.jpg'],
  },
}

export default function ContactoPage() {
  return <ContactoClient />
}
