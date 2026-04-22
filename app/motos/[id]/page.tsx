import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import MotoDetailClient from './MotoDetailClient'

export const dynamic = 'force-dynamic'

// Genera las meta tags Open Graph (previews de WhatsApp/Facebook/Telegram/etc)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const moto = await prisma.listing.findUnique({
      where: { id },
      select: {
        marca: true,
        modelo: true,
        anio: true,
        precio: true,
        km: true,
        ciudad: true,
        provincia: true,
        tipo: true,
        cilindraje: true,
        esElectrica: true,
        fotos: true,
        descripcion: true,
        estado: true,
      },
    })

    if (!moto || moto.estado !== 'activo') {
      return {
        title: 'Moto no encontrada | MotoPatio',
        description: 'Esta publicación ya no está disponible.',
      }
    }

    // Extraer primera foto
    let imagenUrl = 'https://motopatio.com/motopatio-logo.png'
    try {
      const fotos = JSON.parse(moto.fotos || '[]')
      if (fotos[0]) imagenUrl = fotos[0]
    } catch {}

    // Construir título y descripción
    const precio = moto.precio?.toLocaleString() || '0'
    const titulo = `${moto.marca} ${moto.modelo} ${moto.anio} - $${precio}`
    const ubicacion = moto.provincia ? `${moto.ciudad}, ${moto.provincia}` : (moto.ciudad || 'Ecuador')
    const kmTxt = moto.km?.toLocaleString() || '0'
    const unidadCc = moto.esElectrica ? '' : (moto.cilindraje ? ` · ${moto.cilindraje}` : '')
    const descripcion = `${moto.tipo || 'Moto'}${unidadCc} · ${kmTxt} km · ${ubicacion} · Publicado en MotoPatio`

    return {
      title: `${titulo} | MotoPatio`,
      description: descripcion,
      openGraph: {
        title: titulo,
        description: descripcion,
        url: `https://motopatio.com/motos/${id}`,
        siteName: 'MotoPatio',
        images: [
          {
            url: imagenUrl,
            width: 1200,
            height: 630,
            alt: `${moto.marca} ${moto.modelo}`,
          },
        ],
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
  } catch (e) {
    return {
      title: 'MotoPatio',
      description: 'Motos en venta en Ecuador',
    }
  }
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MotoDetailClient params={params} />
}
