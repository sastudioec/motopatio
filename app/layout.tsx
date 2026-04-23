import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GoogleAnalytics from './components/GoogleAnalytics'

export const metadata: Metadata = {
  metadataBase: new URL('https://motopatio.com'),
  title: {
    default: 'MotoPatío - Compra y vende motos en Ecuador',
    template: '%s | MotoPatío',
  },
  description:
    'MotoPatío es el marketplace de motos en Ecuador. Compra y vende motos nuevas y usadas: Quito, Guayaquil, Cuenca y todo el país. Publica tu moto gratis.',
  keywords: [
    'motos Ecuador',
    'comprar moto',
    'vender moto',
    'motos usadas',
    'motos nuevas',
    'marketplace motos',
    'Quito',
    'Guayaquil',
    'MotoPatío',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    title: 'MotoPatío - Compra y vende motos en Ecuador',
    description:
      'Marketplace de motos en Ecuador. Publica tu moto gratis y encuentra tu próxima moto.',
    url: 'https://motopatio.com',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'MotoPatío - Marketplace de motos en Ecuador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoPatío - Compra y vende motos en Ecuador',
    description:
      'Marketplace de motos en Ecuador. Publica tu moto gratis y encuentra tu próxima moto.',
    images: ['/og-default.jpg'],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MotoPatío',
  alternateName: 'MotoPatio',
  url: 'https://motopatio.com',
  logo: 'https://motopatio.com/motopatio-logo.png',
  description:
    'Marketplace de motos usadas y nuevas en Ecuador. Compra, vende y publica tu moto en Quito, Guayaquil, Cuenca y todo el país.',
  areaServed: { '@type': 'Country', name: 'Ecuador' },
  sameAs: [
    'https://www.instagram.com/motopatiolat',
    'https://www.facebook.com/motopatiolat',
    'https://www.tiktok.com/@motopatiolat',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'info@motopatio.com',
    availableLanguage: ['Spanish'],
    areaServed: 'EC',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
