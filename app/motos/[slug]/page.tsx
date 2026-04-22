import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MotoDetailClient from './MotoDetailClient'

export const dynamic = 'force-dynamic'

const BASE = (process.env.NEXTAUTH_URL || 'https://motopatio.com').replace(/\/$/, '')

async function getMoto(slug: string) {
  return prisma.listing.findUnique({
    where: { slug },
    include: { user: { select: { name: true, phone: true } } },
  })
}

function parseFotos(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const moto = await getMoto(slug)

  if (!moto || moto.estado !== 'activo') {
    return {
      title: 'Moto no encontrada | MotoPatío',
      description: 'Esta publicación ya no está disponible.',
    }
  }

  const fotos = parseFotos(moto.fotos)
  const imagenUrl = fotos[0] || `${BASE}/motopatio-logo.png`
  const precio = moto.precio?.toLocaleString() || '0'
  const titulo = `${moto.marca} ${moto.modelo} ${moto.anio} - $${precio}`
  const ubicacion = moto.provincia ? `${moto.ciudad}, ${moto.provincia}` : (moto.ciudad || 'Ecuador')
  const kmTxt = moto.km?.toLocaleString() || '0'
  const unidadCc = moto.esElectrica ? '' : (moto.cilindraje ? ` · ${moto.cilindraje}` : '')
  const descripcion = `${moto.tipo || 'Moto'}${unidadCc} · ${kmTxt} km · ${ubicacion} · Publicado en MotoPatío`
  const url = `${BASE}/motos/${slug}`

  return {
    title: `${titulo} | MotoPatío`,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      siteName: 'MotoPatío',
      images: [{ url: imagenUrl, width: 1200, height: 630, alt: `${moto.marca} ${moto.modelo}` }],
      locale: 'es_EC',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descripcion,
      images: [imagenUrl],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const moto = await getMoto(slug)
  if (!moto) notFound()

  const fotos = parseFotos(moto.fotos)
  const url = `${BASE}/motos/${slug}`
  const km = typeof moto.km === 'number' ? moto.km : 0
  const condition = km === 0 ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition'

  const vehicleJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Vehicle', 'Product'],
    name: `${moto.marca} ${moto.modelo} ${moto.anio}`,
    description: moto.descripcion || `${moto.tipo || 'Moto'} ${moto.marca} ${moto.modelo} ${moto.anio} en venta en Ecuador.`,
    image: fotos.length > 0 ? fotos : [`${BASE}/motopatio-logo.png`],
    brand: { '@type': 'Brand', name: moto.marca },
    model: moto.modelo,
    vehicleModelDate: String(moto.anio),
    ...(moto.tipo ? { bodyType: moto.tipo } : {}),
    ...(moto.color ? { color: moto.color } : {}),
    fuelType: moto.esElectrica ? 'Electric' : 'Gasoline',
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: km,
      unitCode: 'KMT',
    },
    itemCondition: condition,
    offers: {
      '@type': 'Offer',
      url,
      price: moto.precio,
      priceCurrency: 'USD',
      availability: moto.estado === 'activo' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      itemCondition: condition,
      seller: {
        '@type': 'Organization',
        name: 'MotoPatío',
        url: BASE,
      },
      areaServed: { '@type': 'Country', name: 'Ecuador' },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Motos', item: `${BASE}/motos` },
      { '@type': 'ListItem', position: 3, name: `${moto.marca} ${moto.modelo} ${moto.anio}`, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MotoDetailClient moto={moto} />
    </>
  )
}
