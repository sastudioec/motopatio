'use client'
import { useEffect, useState } from 'react'
import MotoCard from '@/app/components/MotoCard'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = {
  listings: any[]
}

const INITIAL_TAKE = 8

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function DestacadasBlock({ listings }: Props) {
  const [shuffled, setShuffled] = useState<any[] | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setShuffled(shuffle(listings))
  }, [listings])

  if (listings.length === 0) return null

  // SSR: primeras 8 en orden destacadoHasta desc (server-side).
  // Client (post-mount): primeras 8 de la lista shuffled.
  // Expanded: todas, ordenadas por destacadoHasta desc (del server).
  const visibles = expanded
    ? listings
    : (shuffled ?? listings).slice(0, INITIAL_TAKE)

  const hayMas = listings.length > INITIAL_TAKE
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
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <div style={{ flex: 1, height: '2px', background: '#e0e0e0', width: '40px' }} />
        </div>
        {hayMas && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E8390E',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            {expanded ? 'Ver menos' : 'Ver todas (' + listings.length + ')'}
          </button>
        )}
      </div>
      <div style={gridStyle}>
        {visibles.map(l => <MotoCard key={l.id} l={l} />)}
      </div>
    </section>
  )
}
