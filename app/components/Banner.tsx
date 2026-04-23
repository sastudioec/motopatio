import Image from 'next/image'
import { pickBanner, BannerPosition } from '@/lib/banners'

interface Props {
  position: BannerPosition
  /** Relación ancho:alto del contenedor. ej: '4/1' para hero, '3/2' para mid */
  aspectRatio?: string
  /** Texto a mostrar cuando no hay banners activos (placeholder) */
  placeholderText?: string
  /** Estilos extras del contenedor */
  style?: React.CSSProperties
  /** Si true, ocupa el 100% del padre (absolute inset:0) sin borderRadius
   *  ni aspectRatio propio. Util para usarlo como fondo full-bleed. */
  fill?: boolean
  /** object-fit del Image (solo aplica con fill=true). Default 'cover'. */
  objectFit?: 'cover' | 'contain'
}

export default async function Banner({
  position,
  aspectRatio = '4/1',
  placeholderText = 'Espacio publicitario disponible',
  style = {},
  fill = false,
  objectFit = 'cover',
}: Props) {
  const banner = await pickBanner(position)

  const containerStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }
    : {
        width: '100%',
        aspectRatio,
        background: '#2a3050',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }

  if (!banner) {
    if (fill) return null
    return (
      <div style={containerStyle}>
        <span style={{ color: '#5a6280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
          {placeholderText}
        </span>
      </div>
    )
  }

  const href = banner.linkUrl
    ? `/api/banners/${banner.id}/click`
    : undefined

  const img = (
    <Image
      src={banner.imageUrl}
      alt={banner.title}
      fill
      sizes="(max-width: 900px) 100vw, 1200px"
      style={{ objectFit }}
    />
  )

  return (
    <div style={containerStyle}>
      {href ? (
        <a href={href} target="_blank" rel="noopener sponsored" style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
          {img}
        </a>
      ) : img}
    </div>
  )
}
