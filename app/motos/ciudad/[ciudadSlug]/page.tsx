import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCiudadBySlug } from '@/lib/category-slugs'
import { getMarcasForCiudad, getTiposForCiudad } from '@/lib/category-queries'
import { buildCollectionPage, buildBreadcrumbList } from '@/lib/category-jsonld'
import CategoryView from '@/app/components/CategoryView'

const BASE = 'https://motopatio.com'
export const revalidate = 3600

async function getData(ciudadSlug: string) {
  const ciudad = getCiudadBySlug(ciudadSlug)
  if (!ciudad) return null
  const listings = await prisma.listing.findMany({
    where: { estado: 'activo', ciudad: ciudad.db },
    orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
    take: 48,
  })
  const minPrecio = listings.length ? Math.min(...listings.map(l => l.precio || 0).filter(n => n > 0)) : null
  const [marcas, tipos] = await Promise.all([
    getMarcasForCiudad(ciudad.db, { limit: 8 }),
    getTiposForCiudad(ciudad.db, { limit: 8 }),
  ])
  return { ciudad, listings, minPrecio, marcas, tipos }
}

export async function generateMetadata({ params }: { params: Promise<{ ciudadSlug: string }> }): Promise<Metadata> {
  const { ciudadSlug } = await params
  const data = await getData(ciudadSlug)
  if (!data) return { title: 'Ciudad no encontrada' }
  const { ciudad, listings, minPrecio } = data
  const count = listings.length
  const url = `${BASE}/motos/ciudad/${ciudadSlug}`
  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const title = `Motos en venta en ${ciudad.db}, Ecuador`
  const description = count > 0
    ? `${count} motos en venta en ${ciudad.db}.${priceSuffix} Compara precios, marcas y modelos. Publica tu moto gratis en MotoPatío.`
    : `Motos en venta en ${ciudad.db} en MotoPatío. Publica tu moto gratis y llega a compradores en ${ciudad.db}.`
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

export default async function Page({ params }: { params: Promise<{ ciudadSlug: string }> }) {
  const { ciudadSlug } = await params
  const data = await getData(ciudadSlug)
  if (!data) notFound()
  const { ciudad, listings, minPrecio, marcas, tipos } = data
  const count = listings.length
  const url = `${BASE}/motos/ciudad/${ciudadSlug}`

  const priceSuffix = minPrecio ? ` Precios desde $${minPrecio.toLocaleString()}.` : ''
  const subcopy = count > 0
    ? `${count} ${count === 1 ? 'moto' : 'motos'} en venta en ${ciudad.db}, Ecuador.${priceSuffix} Compara marcas, precios y kilometraje en MotoPatío.`
    : `Aún no hay motos publicadas en ${ciudad.db}. Sé el primero.`

  const collectionJsonLd = buildCollectionPage({
    url,
    name: `Motos en ${ciudad.db}`,
    description: subcopy,
    listings,
    base: BASE,
  })
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Inicio', item: `${BASE}/` },
    { name: 'Motos', item: `${BASE}/motos` },
    { name: ciudad.db, item: url },
  ])

  const crossLinks = []
  if (marcas.length > 0) {
    crossLinks.push({
      title: `Marcas en ${ciudad.db}`,
      items: marcas.map(m => ({
        label: m.name,
        href: `/motos/marca/${m.slug}/ciudad/${ciudadSlug}`,
        count: m.count,
      })),
    })
  }
  if (tipos.length > 0) {
    crossLinks.push({
      title: `Tipos de moto en ${ciudad.db}`,
      items: tipos.map(t => ({
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
        h1={`Motos en venta en ${ciudad.db}`}
        subcopy={subcopy}
        breadcrumb={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          { label: ciudad.db },
        ]}
        listings={listings}
        publishCta={{ label: `Publicar mi moto en ${ciudad.db}`, href: '/publicar' }}
        viewAllCta={{ label: 'Ver todas las motos', href: '/motos' }}
        emptyState={{
          message: `No hay motos en ${ciudad.db} disponibles ahora.`,
          ctas: [
            { label: 'Ver todas las motos', href: '/motos' },
            { label: 'Publica la tuya', href: '/publicar' },
          ],
        }}
        crossLinks={crossLinks.length > 0 ? crossLinks : undefined}
      />
    </>
  )
}
