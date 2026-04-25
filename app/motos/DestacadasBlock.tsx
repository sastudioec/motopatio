'use client'
import { useEffect, useState } from 'react'
import MotoCard from '@/app/components/MotoCard'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = {
  listings: any[]
  diaSeleccionado?: string | number | null
}

const TAKE = 8

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function DestacadasBlock({ listings, diaSeleccionado }: Props) {
  const [shuffled, setShuffled] = useState<any[] | null>(null)

  useEffect(() => {
    setShuffled(shuffle(listings))
  }, [listings])

  if (listings.length === 0) return null

  // SSR: primeras 8 en orden destacadoHasta desc (server-side).
  // Client (post-mount): primeras 8 de la lista shuffled.
  const visibles = (shuffled ?? listings).slice(0, TAKE)

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '14px',
  }

  return (
    <section style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            background: '#E8390E',
            color: 'white',
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '7px 18px 7px 14px',
          }}
        >
          Motos Destacadas
        </div>
        <div style={{ flex: 1, height: '2px', background: '#e0e0e0', marginLeft: '8px' }} />
      </div>
      <div style={gridStyle}>
        {visibles.map(l => <MotoCard key={l.id} l={l} diaSeleccionado={diaSeleccionado} />)}
      </div>
    </section>
  )
}
