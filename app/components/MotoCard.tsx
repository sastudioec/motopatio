import Link from 'next/link'
import Image from 'next/image'
import { calcularPicoYPlaca } from '@/lib/picoyplaca'

type MotoLike = {
  id: string
  slug?: string | null
  marca: string
  modelo: string
  anio: number
  km: number
  precio: number
  ciudad: string
  provincia?: string | null
  fotos?: string | null
  destacado?: boolean
  destacadoHasta?: string | Date | null
  esElectrica?: boolean
  placa?: string | null
  // Cuando el listing pertenece a un dealer aprobado, viene precargado.
  // Para listings de particulares queda undefined / null y no se muestra badge.
  dealer?: {
    id: string
    slug: string
    nombreComercial: string
    verificado: boolean
    approvalStatus: string
  } | null
}

const DIA_LABEL: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes',
}

export default function MotoCard({ l, diaSeleccionado }: { l: MotoLike; diaSeleccionado?: string | number | null }) {
  const fotos = (() => {
    try {
      return JSON.parse(l.fotos || '[]')
    } catch {
      return []
    }
  })()
  const href = '/motos/' + (l.slug || l.id)
  const ubicacion = l.provincia ? `${l.ciudad}, ${l.provincia}` : l.ciudad
  const isDestacado = !!l.destacadoHasta && new Date(l.destacadoHasta).getTime() > Date.now()
  const showDealerBadge = !!l.dealer && l.dealer.approvalStatus === 'approved'
  const diaNum = diaSeleccionado != null && diaSeleccionado !== '' ? Number(diaSeleccionado) : NaN
  const pypBadge = (() => {
    if (!Number.isFinite(diaNum) || diaNum < 1 || diaNum > 5) return null
    const info = calcularPicoYPlaca(l.placa || '', l.ciudad || '', l.esElectrica)
    if (info.esElectrica) return '⚡ Eléctrica sin restricción'
    if (!info.aplica) return '✓ Sin restricción'
    return `✓ Circula ${DIA_LABEL[diaNum]}`
  })()
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: '4px',
          overflow: 'hidden',
          border: isDestacado ? '1.5px solid #E8390E' : '1.5px solid #e8e8e8',
        }}
      >
        <div
          style={{
            height: '140px',
            background: '#e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            position: 'relative',
          }}
        >
          {fotos[0] ? (
            <Image
              src={fotos[0]}
              alt={`${l.marca} ${l.modelo} ${l.anio} - ${l.ciudad}`}
              width={400}
              height={300}
              sizes="(max-width: 600px) 50vw, 240px"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            '🏍️'
          )}
          {isDestacado && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#E8390E',
                color: 'white',
                fontSize: '9px',
                fontWeight: 800,
                padding: '4px 10px',
              }}
            >
              DESTACADA
            </div>
          )}
          {l.esElectrica && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                background: '#10B981',
                color: 'white',
                fontSize: '9px',
                fontWeight: 800,
                padding: '4px 8px',
              }}
            >
              ⚡ ELÉCTRICA
            </div>
          )}
          {pypBadge && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: 6,
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #10B981',
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 7px',
                borderRadius: '3px',
              }}
            >
              {pypBadge}
            </div>
          )}
          {showDealerBadge && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                background: '#1E2340',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Concesionario"
            >
              🏪 Concesionario
            </div>
          )}
        </div>
        <div style={{ padding: '9px 11px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E2340', textTransform: 'uppercase' }}>
            {l.marca} {l.modelo}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#E8390E' }}>
            ${l.precio?.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {l.anio} · {l.km?.toLocaleString()} km
          </div>
          {ubicacion && (
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>📍 {ubicacion}</div>
          )}
        </div>
      </div>
    </Link>
  )
}
