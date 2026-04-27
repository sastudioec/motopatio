'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuditRow } from './ListingHistorialModal'

type Stats = {
  totalPublicadas: number
  motosVendidas: number
  motosActivas: number
  ultimaAccion: { action: string; createdAt: string } | null
}

type AuditEntry = {
  id: string
  action: string
  changes: Record<string, any> | null
  createdAt: string
  user: { id: string; name: string | null; email: string | null; role: string } | null
  listing: { id: string; marca: string; modelo: string; anio: number; slug: string | null } | null
}

const ACTION_OPTIONS = ['todos', 'created', 'updated', 'status_changed', 'marked_sold', 'deleted'] as const
type ActionFilter = typeof ACTION_OPTIONS[number]

const ACTION_LABEL: Record<string, string> = {
  created: 'Creado', updated: 'Actualizado',
  status_changed: 'Cambio de estado', marked_sold: 'Marcado vendido', deleted: 'Eliminado',
}

export default function DealerActivityModal({
  dealerId, dealerName, onClose,
}: {
  dealerId: string
  dealerName: string
  onClose: () => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [audits, setAudits] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<'todos' | 'admin' | 'dealer' | 'user'>('todos')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('todos')

  const buildQs = useCallback((cursor?: string | null) => {
    const qs = new URLSearchParams()
    if (roleFilter !== 'todos') qs.set('role', roleFilter)
    if (actionFilter !== 'todos') qs.set('action', actionFilter)
    if (cursor) qs.set('cursor', cursor)
    return qs.toString()
  }, [roleFilter, actionFilter])

  // Load inicial cuando cambian filtros
  useEffect(() => {
    setLoading(true)
    setNextCursor(null)
    fetch(`/api/admin/dealers/${dealerId}/audit?` + buildQs())
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats || null)
        setAudits(d.audits || [])
        setNextCursor(d.nextCursor || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [dealerId, buildQs])

  async function loadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const r = await fetch(`/api/admin/dealers/${dealerId}/audit?` + buildQs(nextCursor))
      const d = await r.json()
      setAudits((prev) => [...prev, ...(d.audits || [])])
      setNextCursor(d.nextCursor || null)
    } finally {
      setLoadingMore(false)
    }
  }

  const ultimaFmt = stats?.ultimaAccion
    ? `${ACTION_LABEL[stats.ultimaAccion.action] || stats.ultimaAccion.action} · ${new Date(stats.ultimaAccion.createdAt).toLocaleString('es-EC')}`
    : '—'

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 8, maxWidth: 800, width: '100%',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E2340' }}>📜 Actividad de {dealerName}</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888', padding: '4px 8px' }}>×</button>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ececec' }}>
          {loading || !stats ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 12 }}>Cargando estadísticas…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <StatCard label="Motos publicadas" value={stats.totalPublicadas} />
              <StatCard label="Vendidas" value={stats.motosVendidas} color="#3730A3" />
              <StatCard label="Activas ahora" value={stats.motosActivas} color="#0F6E56" />
              <StatCard label="Última acción" value={ultimaFmt} small />
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #ececec', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Rol:</span>
            {(['todos', 'admin', 'dealer', 'user'] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} style={pill(roleFilter === r)}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Acción:</span>
            {ACTION_OPTIONS.map((a) => (
              <button key={a} onClick={() => setActionFilter(a)} style={pill(actionFilter === a)}>
                {a === 'todos' ? 'Todos' : ACTION_LABEL[a]}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Cargando…</div>
          ) : audits.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 24, background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: 6 }}>
              Sin actividad registrada para los filtros seleccionados.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {audits.map((a) => (
                  <div key={a.id}>
                    <AuditRow a={a} />
                    {a.listing && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4, marginLeft: 15 }}>
                        Sobre: {a.listing.slug
                          ? <a href={`/motos/${a.listing.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E2340', fontWeight: 600 }}>{a.listing.marca} {a.listing.modelo} {a.listing.anio} ↗</a>
                          : <span style={{ color: '#999' }}>{a.listing.marca} {a.listing.modelo} {a.listing.anio} (eliminada)</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {nextCursor && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={loadMore} disabled={loadingMore} style={{
                    background: '#1E2340', color: '#fff', border: 'none',
                    padding: '10px 20px', fontSize: 12, fontWeight: 800,
                    borderRadius: 4, cursor: loadingMore ? 'wait' : 'pointer', textTransform: 'uppercase',
                  }}>
                    {loadingMore ? 'Cargando…' : 'Ver más'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = '#1E2340', small = false }: { label: string; value: number | string; color?: string; small?: boolean }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: 6, padding: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: small ? 13 : 24, fontWeight: 900, color, lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}

function pill(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    background: active ? '#1E2340' : '#fff',
    color: active ? '#fff' : '#1E2340',
    border: '1px solid #1E2340', borderRadius: 4,
    fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
  }
}
