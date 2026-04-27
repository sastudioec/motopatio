import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { ciudadSlugFromDb, tipoSlugFromDb, getTipoByDb } from '@/lib/category-slugs'

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
  let categoryEntries: Entry[] = []

  try {
    const listings = await prisma.listing.findMany({
      where: {
        estado: 'activo',
        slug: { not: null },
        OR: [
          { dealerId: null },
          { dealer: { is: { approvalStatus: 'approved', activo: true } } },
        ],
      },
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

  try {
    // Brands with ≥1 active listing — joined with catalog to get slug
    const marcaGroups = await prisma.listing.groupBy({
      by: ['marca'],
      where: { estado: 'activo' },
      _count: { _all: true },
    })
    const brandNames = marcaGroups.map(g => g.marca)
    const brands = brandNames.length
      ? await prisma.motoBrand.findMany({ where: { name: { in: brandNames } }, select: { name: true, slug: true } })
      : []
    const brandSlugByName = new Map(brands.map(b => [b.name, b.slug]))

    for (const g of marcaGroups) {
      const slug = brandSlugByName.get(g.marca)
      if (!slug) continue
      categoryEntries.push({
        url: `${BASE}/motos/marca/${slug}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      })
    }

    // Cities with ≥1 active listing
    const ciudadGroups = await prisma.listing.groupBy({
      by: ['ciudad'],
      where: { estado: 'activo' },
      _count: { _all: true },
    })
    for (const g of ciudadGroups) {
      categoryEntries.push({
        url: `${BASE}/motos/ciudad/${ciudadSlugFromDb(g.ciudad)}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      })
    }

    // Types with ≥1 active listing — only canonical DB names map to URL
    const tipoGroups = await prisma.listing.groupBy({
      by: ['tipo'],
      where: { estado: 'activo' },
      _count: { _all: true },
    })
    for (const g of tipoGroups) {
      const canonical = getTipoByDb(g.tipo)
      if (!canonical) continue
      categoryEntries.push({
        url: `${BASE}/motos/tipo/${canonical.slug}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      })
    }

    // Combos marca + ciudad
    const marcaCiudadGroups = await prisma.listing.groupBy({
      by: ['marca', 'ciudad'],
      where: { estado: 'activo' },
      _count: { _all: true },
    })
    for (const g of marcaCiudadGroups) {
      const mSlug = brandSlugByName.get(g.marca)
      if (!mSlug) continue
      categoryEntries.push({
        url: `${BASE}/motos/marca/${mSlug}/ciudad/${ciudadSlugFromDb(g.ciudad)}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      })
    }

    // Combos tipo + ciudad
    const tipoCiudadGroups = await prisma.listing.groupBy({
      by: ['tipo', 'ciudad'],
      where: { estado: 'activo' },
      _count: { _all: true },
    })
    for (const g of tipoCiudadGroups) {
      const canonical = getTipoByDb(g.tipo)
      if (!canonical) continue
      categoryEntries.push({
        url: `${BASE}/motos/tipo/${canonical.slug}/ciudad/${ciudadSlugFromDb(g.ciudad)}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.7,
      })
    }
  } catch (e) {
    console.error('sitemap: error cargando categorías:', e)
  }

  return [...staticEntries, ...categoryEntries, ...listingEntries]
}
