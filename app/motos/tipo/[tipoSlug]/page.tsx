import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTipoBySlug } from '@/lib/category-slugs'
import { getCiudadesForTipo } from '@/lib/category-queries'
import { buildCollectionPage, buildBreadcrumbList } from '@/lib/category-jsonld'
import CategoryView from '@/app/components/CategoryView'

const BASE = 'https://motopatio.com'
export const revalidate = 3600

async function getData(tipoSlug: string) {
  const tipo = getTipoBySlug(tipoSlug)
  if (!tipo) return null
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo', tipo: tipo.db },
    orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  const minPrecio = listings.length ? Math.min(...listings.map(l => l.precio || 0).filter(n => n > 0)) : null
  const ciudades = await getCiudadesForTipo(tipo.db, { limit: 8 })
  return { tipo, listings, minPrecio, ciudades }
}

export async function generateMetadata({ params }: { params: Promise<{ tipoSlug: string }> }): Promise<Metadata> {
  const { tipoSlug } = await params
  const data = await getData(tipoSlug)
  if (!data) return { title: 'Tipo no encontrado' }
  const { tipo, listings, minPrecio } = data
  const count = listings.length
  const url = `${BASE}/motos/tipo/${tipoSlug}`
  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const title = `Motos ${tipo.plural} en venta en Ecuador`
  const description = count > 0
    ? `${count} motos ${tipo.plural} en venta en Ecuador.${priceSuffix} Compara marcas, precios y kilometraje. Publica tu moto ${tipo.singular} gratis en MotoPatío.`
    : `Motos ${tipo.plural} en Ecuador en MotoPatío. Publica tu moto ${tipo.singular} gratis y llega a miles de compradores.`
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

export default async function Page({ params }: { params: Promise<{ tipoSlug: string }> }) {
  const { tipoSlug } = await params
  const data = await getData(tipoSlug)
  if (!data) notFound()
  const { tipo, listings, minPrecio, ciudades } = data
  const count = listings.length
  const url = `${BASE}/motos/tipo/${tipoSlug}`

  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const subcopy = count > 0
    ? `${count} ${count === 1 ? 'moto' : 'motos'} ${tipo.plural} en venta en Ecuador.${priceSuffix} Compara marcas, precios y kilometraje en MotoPatío.`
    : `Aún no hay motos ${tipo.plural} publicadas. Sé el primero.`

  const collectionJsonLd = buildCollectionPage({
    url,
    name: `Motos ${tipo.plural} en Ecuador`,
    description: subcopy,
    listings,
    base: BASE,
  })
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Inicio', item: `${BASE}/` },
    { name: 'Motos', item: `${BASE}/motos` },
    { name: `Motos ${tipo.plural}`, item: url },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryView
        h1={`Motos ${tipo.plural} en venta`}
        subcopy={subcopy}
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          { label: `Motos ${tipo.plural}` },
        ]}
        listings={listings}
        publishCta={{ label: `Publicar mi moto`, href: '/publicar' }}
        viewAllCta={{ label: 'Ver todas las motos', href: '/motos' }}
        emptyState={{
          message: `No hay motos ${tipo.plural} disponibles ahora.`,
          ctas: [
            { label: 'Ver todas las motos', href: '/motos' },
            { label: `Publica la primera moto ${tipo.singular}`, href: '/publicar' },
          ],
        }}
        crossLinks={ciudades.length > 0 ? [{
          title: `Motos ${tipo.plural} por ciudad`,
          items: ciudades.map(c => ({
            label: c.name,
            href: `/motos/tipo/${tipoSlug}/ciudad/${c.slug}`,
            count: c.count,
          })),
        }] : undefined}
      />
    </>
  )
}
