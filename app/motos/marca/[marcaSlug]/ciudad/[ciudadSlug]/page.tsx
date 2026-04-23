import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCiudadBySlug } from '@/lib/category-slugs'
import { getCiudadesForMarca, getMarcasForCiudad } from '@/lib/category-queries'
import { buildCollectionPage, buildBreadcrumbList } from '@/lib/category-jsonld'
import CategoryView from '@/app/components/CategoryView'

const BASE = 'https://motopatio.com'
export const revalidate = 3600

async function getData(marcaSlug: string, ciudadSlug: string) {
  const brand = await prisma.motoBrand.findUnique({ where: { slug: marcaSlug } })
  if (!brand) return null
  const ciudad = getCiudadBySlug(ciudadSlug)
  if (!ciudad) return null
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo', marca: brand.name, ciudad: ciudad.db },
    orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  const minPrecio = listings.length ? Math.min(...listings.map(l => l.precio || 0).filter(n => n > 0)) : null
  const [otherCiudades, otherMarcas] = await Promise.all([
    getCiudadesForMarca(brand.name, { limit: 8 }),
    getMarcasForCiudad(ciudad.db, { limit: 8 }),
  ])
  return { brand, ciudad, listings, minPrecio, otherCiudades, otherMarcas }
}

export async function generateMetadata({ params }: { params: Promise<{ marcaSlug: string; ciudadSlug: string }> }): Promise<Metadata> {
  const { marcaSlug, ciudadSlug } = await params
  const data = await getData(marcaSlug, ciudadSlug)
  if (!data) return { title: 'Categoría no encontrada' }
  const { brand, ciudad, listings, minPrecio } = data
  const count = listings.length
  const url = `${BASE}/motos/marca/${marcaSlug}/ciudad/${ciudadSlug}`
  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const title = `Motos ${brand.name} en ${ciudad.db}`
  const description = count > 0
    ? `${count} motos ${brand.name} en venta en ${ciudad.db}, Ecuador.${priceSuffix} Compara precios y contacta al vendedor en MotoPatío.`
    : `Motos ${brand.name} en ${ciudad.db} en MotoPatío. Publica tu ${brand.name} gratis y llega a compradores en ${ciudad.db}.`
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

export default async function Page({ params }: { params: Promise<{ marcaSlug: string; ciudadSlug: string }> }) {
  const { marcaSlug, ciudadSlug } = await params
  const data = await getData(marcaSlug, ciudadSlug)
  if (!data) notFound()
  const { brand, ciudad, listings, minPrecio, otherCiudades, otherMarcas } = data
  const count = listings.length
  const url = `${BASE}/motos/marca/${marcaSlug}/ciudad/${ciudadSlug}`

  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const subcopy = count > 0
    ? `${count} ${count === 1 ? 'moto' : 'motos'} ${brand.name} en ${ciudad.db}, Ecuador.${priceSuffix} Compara año, kilometraje y contacta al vendedor en MotoPatío.`
    : `Aún no hay motos ${brand.name} publicadas en ${ciudad.db}. Sé el primero.`

  const collectionJsonLd = buildCollectionPage({
    url,
    name: `Motos ${brand.name} en ${ciudad.db}`,
    description: subcopy,
    listings,
    base: BASE,
  })
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Inicio', item: `${BASE}/` },
    { name: 'Motos', item: `${BASE}/motos` },
    { name: brand.name, item: `${BASE}/motos/marca/${marcaSlug}` },
    { name: ciudad.db, item: url },
  ])

  const crossLinks = []
  const otherCiudadesFiltered = otherCiudades.filter(c => c.slug !== ciudadSlug)
  if (otherCiudadesFiltered.length > 0) {
    crossLinks.push({
      title: `${brand.name} en otras ciudades`,
      items: otherCiudadesFiltered.map(c => ({
        label: c.name,
        href: `/motos/marca/${marcaSlug}/ciudad/${c.slug}`,
        count: c.count,
      })),
    })
  }
  const otherMarcasFiltered = otherMarcas.filter(m => m.name !== brand.name)
  if (otherMarcasFiltered.length > 0) {
    crossLinks.push({
      title: `Otras marcas en ${ciudad.db}`,
      items: otherMarcasFiltered.map(m => ({
        label: m.name,
        href: `/motos/marca/${m.slug}/ciudad/${ciudadSlug}`,
        count: m.count,
      })),
    })
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryView
        h1={`Motos ${brand.name} en ${ciudad.db}`}
        subcopy={subcopy}
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          { label: brand.name, href: `/motos/marca/${marcaSlug}` },
          { label: ciudad.db },
        ]}
        listings={listings}
        publishCta={{ label: `Publicar mi ${brand.name}`, href: '/publicar' }}
        viewAllCta={{ label: `Ver todas las ${brand.name}`, href: `/motos/marca/${marcaSlug}` }}
        emptyState={{
          message: `No hay motos ${brand.name} en ${ciudad.db} disponibles ahora.`,
          ctas: [
            { label: `Ver todas las ${brand.name}`, href: `/motos/marca/${marcaSlug}` },
            { label: `Ver motos en ${ciudad.db}`, href: `/motos/ciudad/${ciudadSlug}` },
            { label: 'Publica la tuya', href: '/publicar' },
          ],
        }}
        crossLinks={crossLinks.length > 0 ? crossLinks : undefined}
      />
    </>
  )
}
