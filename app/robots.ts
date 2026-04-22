import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/mis-motos',
          '/perfil',
          '/pago',
          '/auth',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
