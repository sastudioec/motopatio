import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTipoBySlug, getCiudadBySlug } from '@/lib/category-slugs'
import { getCiudadesForTipo, getTiposForCiudad } from '@/lib/category-queries'
import { buildCollectionPage, buildBreadcrumbList } from '@/lib/category-jsonld'
import CategoryView from '@/app/components/CategoryView'

const BASE = 'https://motopatio.com'
export const revalidate = 3600

async function getData(tipoSlug: string, ciudadSlug: string) {
  const tipo = getTipoBySlug(tipoSlug)
  if (!tipo) return null
  const ciudad = getCiudadBySlug(ciudadSlug)
  if (!ciudad) return null
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo', tipo: tipo.db, ciudad: ciudad.db },
    orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  const minPrecio = listings.length ? Math.min(...listings.map(l => l.precio || 0).filter(n => n > 0)) : null
  const [otherCiudades, otherTipos] = await Promise.all([
    getCiudadesForTipo(tipo.db, { limit: 8 }),
    getTiposForCiudad(ciudad.db, { limit: 8 }),
  ])
  return { tipo, ciudad, listings, minPrecio, otherCiudades, otherTipos }
}

export async function generateMetadata({ params }: { params: Promise<{ tipoSlug: string; ciudadSlug: string }> }): Promise<Metadata> {
  const { tipoSlug, ciudadSlug } = await params
  const data = await getData(tipoSlug, ciudadSlug)
  if (!data) return { title: 'Categoría no encontrada' }
  const { tipo, ciudad, listings, minPrecio } = data
  const count = listings.length
  const url = `${BASE}/motos/tipo/${tipoSlug}/ciudad/${ciudadSlug}`
  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const title = `Motos ${tipo.plural} en ${ciudad.db}`
  const description = count > 0
    ? `${count} motos ${tipo.plural} en venta en ${ciudad.db}, Ecuador.${priceSuffix} Compara precios y contacta al vendedor en MotoPatío.`
    : `Motos ${tipo.plural} en ${ciudad.db} en MotoPatío. Publica tu moto ${tipo.singular} gratis.`
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: count > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_EC',
      siteName: 'MotoPatío',
      url,
      title: `${title} | MotoPatío`,
      description,
      images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${BASE}/og-default.jpg`] },
  }
}

export default async function Page({ params }: { params: Promise<{ tipoSlug: string; ciudadSlug: string }> }) {
  const { tipoSlug, ciudadSlug } = await params
  const data = await getData(tipoSlug, ciudadSlug)
  if (!data) notFound()
  const { tipo, ciudad, listings, minPrecio, otherCiudades, otherTipos } = data
  const count = listings.length
  const url = `${BASE}/motos/tipo/${tipoSlug}/ciudad/${ciudadSlug}`

  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const subcopy = count > 0
    ? `${count} ${count === 1 ? 'moto' : 'motos'} ${tipo.plural} en ${ciudad.db}, Ecuador.${priceSuffix} Compara marcas y contacta al vendedor en MotoPatío.`
    : `Aún no hay motos ${tipo.plural} publicadas en ${ciudad.db}.`

  const collectionJsonLd = buildCollectionPage({
    url,
    name: `Motos ${tipo.plural} en ${ciudad.db}`,
    description: subcopy,
    listings,
    base: BASE,
  })
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Inicio', item: `${BASE}/` },
    { name: 'Motos', item: `${BASE}/motos` },
    { name: `Motos ${tipo.plural}`, item: `${BASE}/motos/tipo/${tipoSlug}` },
    { name: ciudad.db, item: url },
  ])

  const crossLinks = []
  const otherCiudadesFiltered = otherCiudades.filter(c => c.slug !== ciudadSlug)
  if (otherCiudadesFiltered.length > 0) {
    crossLinks.push({
      title: `Motos ${tipo.plural} en otras ciudades`,
      items: otherCiudadesFiltered.map(c => ({
        label: c.name,
        href: `/motos/tipo/${tipoSlug}/ciudad/${c.slug}`,
        count: c.count,
      })),
    })
  }
  const otherTiposFiltered = otherTipos.filter(t => t.slug !== tipoSlug)
  if (otherTiposFiltered.length > 0) {
    crossLinks.push({
      title: `Otros tipos en ${ciudad.db}`,
      items: otherTiposFiltered.map(t => ({
        label: t.name,
        href: `/motos/tipo/${t.slug}/ciudad/${ciudadSlug}`,
        count: t.count,
      })),
    })
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryView
        h1={`Motos ${tipo.plural} en ${ciudad.db}`}
        subcopy={subcopy}
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          { label: `Motos ${tipo.plural}`, href: `/motos/tipo/${tipoSlug}` },
          { label: ciudad.db },
        ]}
        listings={listings}
        publishCta={{ label: `Publicar mi moto`, href: '/publicar' }}
        viewAllCta={{ label: `Ver todas las motos ${tipo.plural}`, href: `/motos/tipo/${tipoSlug}` }}
        emptyState={{
          message: `No hay motos ${tipo.plural} en ${ciudad.db} disponibles ahora.`,
          ctas: [
            { label: `Ver todas las motos ${tipo.plural}`, href: `/motos/tipo/${tipoSlug}` },
            { label: `Ver motos en ${ciudad.db}`, href: `/motos/ciudad/${ciudadSlug}` },
            { label: 'Publica la tuya', href: '/publicar' },
          ],
        }}
        crossLinks={crossLinks.length > 0 ? crossLinks : undefined}
      />
    </>
  )
}
