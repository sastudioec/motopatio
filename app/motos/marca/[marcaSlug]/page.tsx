import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { publicListingFilter, publicListingDealerInclude } from '@/lib/listings-public'
import { getCiudadesForMarca } from '@/lib/category-queries'
import { buildCollectionPage, buildBreadcrumbList } from '@/lib/category-jsonld'
import CategoryView from '@/app/components/CategoryView'

const BASE = 'https://motopatio.com'
export const revalidate = 3600

async function getData(marcaSlug: string) {
  const brand = await prisma.motoBrand.findUnique({ where: { slug: marcaSlug } })
  if (!brand) return null
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo', marca: brand.name, ...publicListingFilter() },
    include: publicListingDealerInclude,
    orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  const minPrecio = listings.length ? Math.min(...listings.map(l => l.precio || 0).filter(n => n > 0)) : null
  const ciudades = await getCiudadesForMarca(brand.name, { limit: 8 })
  return { brand, listings, minPrecio, ciudades }
}

export async function generateMetadata({ params }: { params: Promise<{ marcaSlug: string }> }): Promise<Metadata> {
  const { marcaSlug } = await params
  const data = await getData(marcaSlug)
  if (!data) return { title: 'Marca no encontrada' }
  const { brand, listings } = data
  const count = listings.length
  const url = `${BASE}/motos/marca/${marcaSlug}`
  const title = `Motos ${brand.name} en venta en Ecuador, usadas y nuevas`
  const description = `Encuentra motos ${brand.name} en venta en Ecuador. ${brand.name} usadas, nuevas y de concesionario en Quito, Guayaquil y todo el país.`
  return {
    title: { absolute: `${title} | MotoPatío` },
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

export default async function Page({ params }: { params: Promise<{ marcaSlug: string }> }) {
  const { marcaSlug } = await params
  const data = await getData(marcaSlug)
  if (!data) notFound()
  const { brand, listings, minPrecio, ciudades } = data
  const count = listings.length
  const url = `${BASE}/motos/marca/${marcaSlug}`

  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const subcopy = count > 0
    ? `${count} ${count === 1 ? 'moto' : 'motos'} ${brand.name} en venta en Ecuador.${priceSuffix} Compara precios, año y kilometraje en MotoPatío.`
    : `Aún no hay motos ${brand.name} publicadas en MotoPatío. Sé el primero en publicar una.`

  const collectionJsonLd = buildCollectionPage({
    url,
    name: `Motos ${brand.name} en Ecuador`,
    description: subcopy,
    listings,
    base: BASE,
  })
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Inicio', item: `${BASE}/` },
    { name: 'Motos', item: `${BASE}/motos` },
    { name: brand.name, item: url },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryView
        h1={`Motos ${brand.name} en venta`}
        subcopy={subcopy}
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          { label: brand.name },
        ]}
        listings={listings}
        publishCta={{ label: `Publicar mi ${brand.name}`, href: '/publicar' }}
        viewAllCta={{ label: 'Ver todas las motos', href: '/motos' }}
        emptyState={{
          message: `No hay motos ${brand.name} disponibles ahora.`,
          ctas: [
            { label: 'Ver todas las motos', href: '/motos' },
            { label: `Publica la primera ${brand.name}`, href: '/publicar' },
          ],
        }}
        crossLinks={ciudades.length > 0 ? [{
          title: `${brand.name} por ciudad`,
          items: ciudades.map(c => ({
            label: c.name,
            href: `/motos/marca/${marcaSlug}/ciudad/${c.slug}`,
            count: c.count,
          })),
        }] : undefined}
      />
    </>
  )
}
