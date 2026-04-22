import { pickBanner, BannerPosition } from '@/lib/banners'

interface Props {
  position: BannerPosition
  /** Relación ancho:alto del contenedor. ej: '4/1' para hero, '3/2' para mid */
  aspectRatio?: string
  /** Texto a mostrar cuando no hay banners activos (placeholder) */
  placeholderText?: string
  /** Estilos extras del contenedor */
  style?: React.CSSProperties
}

export default async function Banner({
  position,
  aspectRatio = '4/1',
  placeholderText = 'Espacio publicitario disponible',
  style = {},
}: Props) {
  const banner = await pickBanner(position)

  const containerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio,
    background: '#2a3050',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  if (!banner) {
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
    <img
      src={banner.imageUrl}
      alt={banner.title}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )

  return (
    <div style={containerStyle}>
      {href ? (
        <a href={href} target="_blank" rel="noopener sponsored" style={{ display: 'block', width: '100%', height: '100%' }}>
          {img}
        </a>
      ) : img}
    </div>
  )
}
