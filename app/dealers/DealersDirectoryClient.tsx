'use client'

import { useEffect, useState, ReactNode } from 'react'
import DealerCard from '@/app/components/DealerCard'
import StyledSelect from '@/app/components/StyledSelect'

type Dealer = {
  id: string
  slug: string
  nombreComercial: string
  logo: string | null
  bannerImage: string | null
  ciudad: string
  provincia: string
  verificado: boolean
}

const ADS_AFTER_N = 6

export default function DealersDirectoryClient({
  initialDealers,
  ciudades,
  adSlots,
}: {
  initialDealers: Dealer[]
  ciudades: string[]
  // 2 placeholders renderizados server-side (Banner mid_left + mid_right
  // o "Espacio publicitario disponible"). Vienen como ReactNode para
  // poder reusar el componente Banner sin duplicar logica.
  adSlots: ReactNode
}) {
  const [ciudad, setCiudad] = useState<string>('todas')
  const [dealers, setDealers] = useState<Dealer[]>(initialDealers)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (ciudad !== 'todas') params.set('ciudad', ciudad)
      const res = await fetch('/api/dealers?' + params.toString())
      if (cancel) return
      if (res.ok) {
        const d = await res.json()
        setDealers(d.dealers || [])
      }
      setLoading(false)
    }
    load()
    return () => { cancel = true }
  }, [ciudad])

  const firstChunk = dealers.slice(0, ADS_AFTER_N)
  const restChunk = dealers.slice(ADS_AFTER_N)

  return (
    <>
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        marginBottom: '24px', alignItems: 'center',
      }}>
        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E2340', display: 'flex', alignItems: 'center', gap: 8 }}>
          Ciudad:
          <StyledSelect value={ciudad} onChange={setCiudad} ariaLabel="Filtrar por ciudad" minWidth={180}>
            <option value="todas">Todas</option>
            {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
          </StyledSelect>
        </label>
        {loading && <span style={{ fontSize: '12px', color: '#888' }}>Cargando…</span>}
      </div>

      {dealers.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
          padding: '40px', textAlign: 'center', color: '#888',
        }}>
          No hay concesionarios que coincidan con el filtro.
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {firstChunk.map((d) => <DealerCard key={d.id} dealer={d} />)}
          </div>

          {/* AdSlots intercalados (2 cuadros lado a lado, mismo patron que home) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            margin: '20px 0',
          }}>
            {adSlots}
          </div>

          {restChunk.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}>
              {restChunk.map((d) => <DealerCard key={d.id} dealer={d} />)}
            </div>
          )}
        </>
      )}
    </>
  )
}
