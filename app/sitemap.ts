import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(/\/$/, '')

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: Entry[] = [
    { url: `${BASE}/`,                          lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/motos`,                     lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/precios`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/ayuda`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contacto`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terminos`,                  lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE}/politica-de-privacidad`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE}/politica-de-reembolsos`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
  ]

  let listingEntries: Entry[] = []
  try {
    const listings = await prisma.listing.findMany({
      where: { estado: 'activo', slug: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    listingEntries = listings
      .filter(l => !!l.slug)
      .map(l => ({
        url: `${BASE}/motos/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      }))
  } catch (e) {
    console.error('sitemap: error cargando listings:', e)
  }

  return [...staticEntries, ...listingEntries]
}
