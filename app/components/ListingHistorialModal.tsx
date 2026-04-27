'use client'

import { useState, useEffect } from 'react'

type AuditEntry = {
  id: string
  action: string
  changes: Record<string, any> | null
  createdAt: string
  user: { id: string; name: string | null; email: string | null; role: string } | null
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Creado', color: '#0F6E56' },
  updated: { label: 'Actualizado', color: '#4338CA' },
  status_changed: { label: 'Cambio de estado', color: '#B45309' },
  marked_sold: { label: 'Marcado vendido', color: '#3730A3' },
  deleted: { label: 'Eliminado', color: '#A32D2D' },
}

/**
 * Modal de timeline de auditoría de un listing. Reusable entre /admin y
 * /mi-tienda — el caller pasa la URL base del endpoint que devuelve
 * `{ audits: [...] }`.
 *
 * - showRoleFilter: para que el dealer no necesite ver el filtro
 *   (sus motos siempre tienen pocos roles que las tocan).
 */
export default function ListingHistorialModal({
  listingId, endpointBase, onClose, showRoleFilter = true,
}: {
  listingId: string
  // Ej: '/api/admin/motos' (componente arma `${base}/${listingId}/audit`).
  endpointBase: string
  onClose: () => void
  showRoleFilter?: boolean
}) {
  const [audits, setAudits] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<'todos' | 'admin' | 'dealer' | 'user'>('todos')

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (roleFilter !== 'todos') qs.set('role', roleFilter)
    fetch(`${endpointBase}/${listingId}/audit?${qs.toString()}`)
      .then(r => r.json())
      .then(d => { setAudits(d.audits || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [listingId, roleFilter, endpointBase])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 8, maxWidth: 720, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ececec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E2340' }}>📜 Historial de cambios</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666', fontFamily: 'monospace' }}>{listingId}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888', padding: '4px 8px' }}>×</button>
        </div>

        {showRoleFilter && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #ececec', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Filtrar por rol:</span>
            {(['todos', 'admin', 'dealer', 'user'] as const).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '4px 10px',
                background: roleFilter === r ? '#1E2340' : '#fff',
                color: roleFilter === r ? '#fff' : '#1E2340',
                border: '1px solid #1E2340', borderRadius: 4,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
              }}>{r}</button>
            ))}
          </div>
        )}

        <div style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Cargando…</div>
          ) : audits.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 24, background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: 6 }}>
              Sin acciones registradas {roleFilter !== 'todos' ? `de ${roleFilter}s` : ''} para este listing.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {audits.map((a) => <AuditRow key={a.id} a={a} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AuditRow({ a }: { a: AuditEntry }) {
  const lbl = ACTION_LABELS[a.action] || { label: a.action, color: '#666' }
  return (
    <div style={{ borderLeft: `3px solid ${lbl.color}`, paddingLeft: 12, paddingBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ background: lbl.color + '20', color: lbl.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
          {lbl.label}
        </span>
        <span style={{ fontSize: 11, color: '#888' }}>
          {new Date(a.createdAt).toLocaleString('es-EC')}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        Por: <strong style={{ color: '#1E2340' }}>{a.user?.email || '— (user borrado)'}</strong>
        {a.user?.role && (
          <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: '#EEF2FF', color: '#4338CA', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>{a.user.role}</span>
        )}
      </div>
      {a.changes && Object.keys(a.changes).length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, background: '#fafafa', border: '1px solid #ececec', borderRadius: 4, padding: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {Object.entries(a.changes as Record<string, any>).map(([k, v]) => (
            <div key={k}>
              {v && typeof v === 'object' && 'from' in v && 'to' in v
                ? <><strong>{k}:</strong> {JSON.stringify(v.from)} → {JSON.stringify(v.to)}</>
                : <><strong>{k}:</strong> {JSON.stringify(v)}</>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
