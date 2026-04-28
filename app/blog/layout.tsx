import type { Metadata } from 'next'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(
  /\/$/,
  ''
)

const TITLE = 'Blog MotoPatío: guías y consejos de motos en Ecuador'
const SOCIAL_TITLE = `${TITLE} | MotoPatío`
const DESC =
  'Guías, trámites y consejos para comprar, vender y mantener tu moto en Ecuador. Información práctica para motociclistas en Quito, Guayaquil, Cuenca y todo el país.'

export const metadata: Metadata = {
  title: { absolute: SOCIAL_TITLE },
  description: DESC,
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: `${BASE}/blog`,
    title: SOCIAL_TITLE,
    description: DESC,
    images: [
      {
        url: `${BASE}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'MotoPatío Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SOCIAL_TITLE,
    description: DESC,
    images: [`${BASE}/og-default.jpg`],
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
