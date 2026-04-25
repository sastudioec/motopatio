import Link from 'next/link'
import MotoCard from '@/app/components/MotoCard'
import type { ScoredListing, Chip } from './related'

type Props = {
  title: string
  listings: ScoredListing[]
  chips: Chip[]
}

/**
 * Bloque "Mas motos" al final del detalle. Server-rendered para que el HTML
 * llegue completo al primer render (SEO). Reusa MotoCard del catalogo
 * principal para que el grid sea visualmente identico al de /motos.
 *
 * Si listings tiene menos de N_MIN (manejado upstream en related.ts), no
 * se llama este componente.
 */
export default function RelatedBlock({ title, listings, chips }: Props) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto 40px', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
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
          {title}
        </div>
        <div style={{ flex: 1, height: '2px', background: '#e0e0e0' }} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {listings.map((r) => (
          <MotoCard key={r.l.id} l={r.l} />
        ))}
      </div>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          {chips.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                display: 'inline-block',
                background: '#fff',
                border: '1px solid #e0e0e0',
                color: '#1E2340',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {c.label} →
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
