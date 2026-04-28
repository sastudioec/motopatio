'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import LeadsDateFilter from '@/app/components/LeadsDateFilter'
import ListingHistorialModal from '@/app/components/ListingHistorialModal'
import { formatFechaCortaHora, formatFechaLarga } from '@/lib/format-date'

type DealerSummary = {
  slug: string
  nombreComercial: string
  verificado: boolean
  activo: boolean
  approvalStatus: string
  rejectionNotes: string | null
  subscriptionStatus: string
  trialEndsAt: string | null
  trialDaysRemaining: number
}
type Verification = {
  id: string
  documentType: string
  status: string
  createdAt: string
  reviewedAt: string | null
  notes: string | null
}
type ListingSummary = {
  id: string
  slug: string | null
  marca: string
  modelo: string
  anio: number
  precio: number
  estado: string
  fotos: string | null
  createdAt: string
}
type LeadSummary = {
  id: string
  nombre: string
  telefono: string
  ciudad: string | null
  interesadoFinanciamiento: boolean
  createdAt: string
  listingTitle: string | null
  listingSlug: string | null
}

type TabId = 'resumen' | 'anuncios' | 'leads' | 'suscripcion'

const TABS: { id: TabId; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'leads', label: 'Leads' },
  { id: 'suscripcion', label: 'Suscripción' },
]

export default function MiTiendaTabsClient({
  dealer, verifications, listings, leads,
}: {
  dealer: DealerSummary
  verifications: Verification[]
  listings: ListingSummary[]
  leads: LeadSummary[]
}) {
  const [tab, setTab] = useState<TabId>('resumen')

  return (
    <>
      <ApprovalBanner dealer={dealer} />

      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Fade derecho: indica que hay mas tabs hacia la derecha en mobile */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '32px',
            background: 'linear-gradient(to right, rgba(250,250,250,0), rgba(250,250,250,1))',
            pointerEvents: 'none', zIndex: 1,
          }} />
          <nav style={{
            display: 'flex', borderBottom: '1px solid #e0e0e0',
            background: '#fafafa', overflowX: 'auto', scrollbarWidth: 'thin',
          }}>
          {TABS.map((t) => {
            const count = t.id === 'anuncios' ? listings.length : t.id === 'leads' ? leads.length : null
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? '#E8390E' : '#666',
                  border: 'none',
                  borderBottom: tab === t.id ? '3px solid #E8390E' : '3px solid transparent',
                  padding: '14px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                {t.label}{count !== null ? ` (${count})` : ''}
              </button>
            )
          })}
          <Link
            href="/mi-tienda/perfil"
            style={{
              background: 'transparent', color: '#666',
              padding: '14px 20px', fontSize: '13px',
              fontWeight: 700, textTransform: 'uppercase',
              textDecoration: 'none', borderBottom: '3px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            Perfil
          </Link>
          {dealer.approvalStatus === 'approved' && (
            <Link
              href={`/dealers/${dealer.slug}`}
              target="_blank"
              style={{
                background: 'transparent', color: '#1E2340',
                padding: '14px 20px', fontSize: '13px',
                fontWeight: 700, textTransform: 'uppercase',
                textDecoration: 'none', borderBottom: '3px solid transparent',
                marginLeft: 'auto', whiteSpace: 'nowrap',
              }}>
              ↗ Ver perfil público
            </Link>
          )}
          </nav>
        </div>

        <div style={{ padding: '24px' }}>
          {tab === 'resumen' && <ResumenTab dealer={dealer} verifications={verifications} listings={listings} />}
          {tab === 'anuncios' && <AnunciosTab dealer={dealer} listings={listings} />}
          {tab === 'leads' && <LeadsTab leads={leads} />}
          {tab === 'suscripcion' && <Placeholder
            title="Suscripción"
            text={`Estás en período de prueba (${dealer.trialDaysRemaining} días restantes). El flujo de suscripción mensual con renovación manual llega en el próximo PR.`} />}
        </div>
      </div>
    </>
  )
}

function ApprovalBanner({ dealer }: { dealer: DealerSummary }) {
  if (dealer.approvalStatus === 'approved') return null
  if (dealer.approvalStatus === 'pending_approval') {
    return (
      <div style={{
        background: '#FEF3C7', border: '1px solid #F59E0B',
        borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
        fontSize: '14px', color: '#78350F', fontWeight: 600, lineHeight: 1.5,
      }}>
        ⏳ <strong>Tu cuenta está en revisión.</strong> Tus motos y tu perfil público se activarán cuando aprobemos tu concesionario. Puedes cargar motos ahora y se publicarán automáticamente al aprobarte.
      </div>
    )
  }
  if (dealer.approvalStatus === 'rejected') {
    return (
      <div style={{
        background: '#FEE2E2', border: '1px solid #EF4444',
        borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
        fontSize: '14px', color: '#7F1D1D', fontWeight: 600, lineHeight: 1.5,
      }}>
        ❌ <strong>Tu cuenta fue rechazada.</strong> Contactanos a <a href="mailto:info@motopatio.com" style={{ color: '#7F1D1D', textDecoration: 'underline' }}>info@motopatio.com</a> para más información.
        {dealer.rejectionNotes && (
          <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 500 }}>
            Nota del equipo: {dealer.rejectionNotes}
          </div>
        )}
      </div>
    )
  }
  return null
}

function listingBadge(listing: ListingSummary, dealerApproved: boolean) {
  if (listing.estado === 'vendido') return { label: '✓ Vendido', bg: '#D1FAE5', color: '#065F46' }
  if (listing.estado === 'pausado' || listing.estado === 'suspendido') return { label: '⏸ Pausado', bg: '#FEF3C7', color: '#78350F' }
  if (!dealerApproved) return { label: '⏳ En revisión', bg: '#FEF3C7', color: '#78350F' }
  return { label: '✅ Activo', bg: '#D1FAE5', color: '#065F46' }
}

function firstFoto(raw: string | null): string | null {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) && arr[0] ? arr[0] : null
  } catch {
    return null
  }
}

function AnunciosTab({ dealer, listings }: { dealer: DealerSummary; listings: ListingSummary[] }) {
  const router = useRouter()
  const dealerApproved = dealer.approvalStatus === 'approved'
  const [busy, setBusy] = useState<string | null>(null)
  const [historialId, setHistorialId] = useState<string | null>(null)

  async function patchEstado(id: string, estado: string) {
    setBusy(id)
    try {
      const res = await fetch(`/api/mis-motos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo')); return }
      router.refresh()
    } finally { setBusy(null) }
  }
  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta moto? Esta acción no se puede deshacer.')) return
    if (!confirm('Confirma una vez más: la moto se borra permanentemente.')) return
    setBusy(id)
    try {
      const res = await fetch(`/api/mis-motos/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo')); return }
      router.refresh()
    } finally { setBusy(null) }
  }

  const activeCount = listings.filter((l) => l.estado === 'activo').length
  const TRIAL_LIMIT = 20
  const limitReached = activeCount >= TRIAL_LIMIT

  return (
    <div>
      {limitReached ? (
        <div style={{
          background:'#fff5f0',
          border:'2px solid #E8390E',
          borderLeft:'6px solid #E8390E',
          borderRadius:'8px',
          padding:'14px 18px',
          marginBottom:'16px',
          fontSize:'14px',
          color:'#1E2340',
          fontWeight:700,
          lineHeight:1.5,
        }}>
          Has alcanzado el máximo de {TRIAL_LIMIT} motos del programa de lanzamiento. Cuando vendas alguna podrás publicar otra.
        </div>
      ) : (
        <div style={{
          background:'#fff',
          border:'1px solid #e0e0e0',
          borderRadius:'8px',
          padding:'10px 14px',
          marginBottom:'16px',
          fontSize:'13px',
          color:'#52525b',
          lineHeight:1.5,
        }}>
          <strong style={{color:'#1E2340'}}>{activeCount} de {TRIAL_LIMIT}</strong> motos activas en el programa de lanzamiento.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          {listings.length} {listings.length === 1 ? 'anuncio cargado' : 'anuncios cargados'}.
          {!dealerApproved && ' Se publicarán al aprobarte.'}
        </div>
        <Link href="/publicar" style={{
          background: '#E8390E', color: '#fff',
          padding: '10px 18px', borderRadius: '4px', textDecoration: 'none',
          fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
        }}>+ Publicar moto</Link>
      </div>
      {listings.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: '#888',
          background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: '6px',
        }}>
          Todavía no cargaste ninguna moto. Hazlo desde el botón "+ Publicar moto" arriba.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
        }}>
          {listings.map((l) => {
            const badge = listingBadge(l, dealerApproved)
            const foto = firstFoto(l.fotos)
            const disabled = busy === l.id
            const isPaused = l.estado === 'suspendido'
            const isSold = l.estado === 'vendido'
            return (
              <div key={l.id} style={{
                background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden',
                opacity: disabled ? 0.6 : 1,
              }}>
                <div style={{ height: 120, background: '#f4f4f5', position: 'relative' }}>
                  {foto && <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: badge.bg, color: badge.color,
                    fontSize: '10px', fontWeight: 800, padding: '3px 8px',
                    borderRadius: '999px', border: '1px solid rgba(0,0,0,0.05)',
                  }}>{badge.label}</div>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E2340' }}>
                    {l.marca} {l.modelo}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{l.anio}</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#E8390E', marginTop: 4 }}>
                    ${l.precio?.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    <Link href={`/mi-tienda/anuncios/${l.id}/editar`} style={{ ...btnSm('#1E2340'), textDecoration: 'none', display: 'inline-block' }}>Editar</Link>
                    {!isSold && (
                      <button onClick={() => patchEstado(l.id, isPaused ? 'activo' : 'suspendido')} disabled={disabled} style={btnSm(isPaused ? '#10B981' : '#ca8a04')}>
                        {isPaused ? 'Reactivar' : 'Pausar'}
                      </button>
                    )}
                    {!isSold && (
                      <button onClick={() => { if (confirm('¿Marcar como vendida?')) patchEstado(l.id, 'vendido') }} disabled={disabled} style={btnSm('#3730A3')}>Vendida</button>
                    )}
                    <button onClick={() => setHistorialId(l.id)} disabled={disabled} style={btnSm('#4338CA')}>📜 Historial</button>
                    <button onClick={() => handleEliminar(l.id)} disabled={disabled} style={btnSm('#E8390E')}>Eliminar</button>
                  </div>
                  {dealerApproved && l.slug && l.estado === 'activo' && (
                    <a href={`/motos/${l.slug}`} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-block', marginTop: 8,
                      fontSize: '11px', color: '#1E2340', textDecoration: 'underline',
                    }}>Ver en el sitio ↗</a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {historialId && (
        <ListingHistorialModal
          listingId={historialId}
          endpointBase="/api/mis-motos"
          onClose={() => setHistorialId(null)}
        />
      )}
    </div>
  )
}

function btnSm(color: string): React.CSSProperties {
  return {
    background: '#fff',
    color,
    border: `1px solid ${color}`,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 4,
    cursor: 'pointer',
    textTransform: 'uppercase',
  }
}


type SortKey = 'createdAt' | 'nombre' | 'ciudad' | 'listingTitle' | 'interesadoFinanciamiento'
type SortDir = 'asc' | 'desc' | null

function LeadsTab({ leads }: { leads: LeadSummary[] }) {
  // Ciclo: null (default fecha desc) -> asc -> desc -> null
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  function handleHeaderClick(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  const sortedLeads = (() => {
    if (!sortKey || !sortDir) return leads // default: ya viene desc por createdAt
    const factor = sortDir === 'asc' ? 1 : -1
    return [...leads].sort((a, b) => {
      const av = (a[sortKey] ?? '') as any
      const bv = (b[sortKey] ?? '') as any
      if (sortKey === 'createdAt') return (new Date(av).getTime() - new Date(bv).getTime()) * factor
      if (sortKey === 'interesadoFinanciamiento') return ((av ? 1 : 0) - (bv ? 1 : 0)) * factor
      return String(av).localeCompare(String(bv), 'es') * factor
    })
  })()

  const sp = useSearchParams()
  function exportCsv() {
    // Pasar los mismos params de fecha al export para que el CSV respete el filtro.
    const qs = new URLSearchParams()
    const d = sp.get('desde'); const h = sp.get('hasta')
    if (d) qs.set('desde', d)
    if (h) qs.set('hasta', h)
    const s = qs.toString()
    window.location.href = '/api/dealers/me/leads/export' + (s ? '?' + s : '')
  }

  if (leads.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <LeadsDateFilter />
        </div>
        <div style={{
          padding: '40px 20px', textAlign: 'center', color: '#888',
          background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: '6px',
        }}>
          Sin leads en el rango seleccionado.
        </div>
      </div>
    )
  }

  function arrow(key: SortKey) {
    if (sortKey !== key) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>
    if (sortDir === 'asc') return <span style={{ color: '#E8390E', marginLeft: 4 }}>↑</span>
    if (sortDir === 'desc') return <span style={{ color: '#E8390E', marginLeft: 4 }}>↓</span>
    return null
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <LeadsDateFilter />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#666' }}>
          {leads.length} {leads.length === 1 ? 'lead recibido' : 'leads recibidos'}{sp.get('desde') || sp.get('hasta') ? ' en el rango.' : '.'}
        </div>
        <button onClick={exportCsv} style={{
          background: '#1E2340', color: '#fff', border: 'none',
          padding: '10px 16px', borderRadius: 4, fontSize: 12, fontWeight: 800,
          cursor: 'pointer', textTransform: 'uppercase',
        }}>
          📥 Exportar CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#fafafa', textAlign: 'left' }}>
              <th style={thClickable} onClick={() => handleHeaderClick('createdAt')}>Fecha {arrow('createdAt')}</th>
              <th style={thClickable} onClick={() => handleHeaderClick('nombre')}>Nombre {arrow('nombre')}</th>
              <th style={th}>Teléfono</th>
              <th style={thClickable} onClick={() => handleHeaderClick('ciudad')}>Ciudad {arrow('ciudad')}</th>
              <th style={thClickable} onClick={() => handleHeaderClick('listingTitle')}>Moto {arrow('listingTitle')}</th>
              <th style={thClickable} onClick={() => handleHeaderClick('interesadoFinanciamiento')}>Financ. {arrow('interesadoFinanciamiento')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((l) => (
              <tr key={l.id} style={{ borderTop: '1px solid #ececec' }}>
                <td style={td}>{formatFechaCortaHora(l.createdAt)}</td>
                <td style={{ ...td, fontWeight: 600 }}>{l.nombre}</td>
                <td style={td}><a href={`tel:${l.telefono}`} style={{ color: '#E8390E' }}>{l.telefono}</a></td>
                <td style={td}>{l.ciudad ?? '—'}</td>
                <td style={td}>
                  {l.listingTitle ? (
                    l.listingSlug
                      ? <a href={`/motos/${l.listingSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E2340' }}>{l.listingTitle}</a>
                      : l.listingTitle
                  ) : '—'}
                </td>
                <td style={td}>{l.interesadoFinanciamiento ? 'Sí' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: '11px', fontWeight: 800, color: '#666', textTransform: 'uppercase' }
const thClickable: React.CSSProperties = { ...th, cursor: 'pointer', userSelect: 'none' }
const td: React.CSSProperties = { padding: '10px 12px', color: '#1E2340' }

function ResumenTab({ dealer, verifications, listings }: { dealer: DealerSummary; verifications: Verification[]; listings: ListingSummary[] }) {
  const trialFmt = dealer.trialEndsAt ? formatFechaLarga(dealer.trialEndsAt) : '—'
  const pending = verifications.find((v) => v.status === 'pending')
  const rejected = verifications.find((v) => v.status === 'rejected')

  const activeCount = listings.filter((l) => l.estado === 'activo').length
  const TRIAL_LIMIT = 20
  const limitReached = activeCount >= TRIAL_LIMIT

  return (
    <>
      {limitReached ? (
        <div style={{
          background:'#fff5f0',
          border:'2px solid #E8390E',
          borderLeft:'6px solid #E8390E',
          borderRadius:'8px',
          padding:'14px 18px',
          marginBottom:'16px',
          fontSize:'14px',
          color:'#1E2340',
          fontWeight:700,
          lineHeight:1.5,
        }}>
          Has alcanzado el máximo de {TRIAL_LIMIT} motos del programa de lanzamiento. Cuando vendas alguna podrás publicar otra.
        </div>
      ) : activeCount > 0 ? (
        <div style={{
          background:'#fff',
          border:'1px solid #e0e0e0',
          borderRadius:'8px',
          padding:'10px 14px',
          marginBottom:'16px',
          fontSize:'13px',
          color:'#52525b',
          lineHeight:1.5,
        }}>
          <strong style={{color:'#1E2340'}}>{activeCount} de {TRIAL_LIMIT}</strong> motos activas en el programa de lanzamiento.
        </div>
      ) : (
        <div style={{
          background:'#f0fdf4',
          border:'1px solid #bbf7d0',
          borderLeft:'4px solid #16a34a',
          borderRadius:'8px',
          padding:'10px 14px',
          marginBottom:'16px',
          fontSize:'13px',
          color:'#166534',
          lineHeight:1.5,
        }}>
          Tienes <strong>{TRIAL_LIMIT}</strong> motos disponibles para publicar en el programa de lanzamiento.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      <Card title="Estado">
        <Row label="Aprobación" value={
          dealer.approvalStatus === 'approved' ? '✅ Aprobado'
          : dealer.approvalStatus === 'rejected' ? '❌ Rechazado'
          : '⏳ En revisión'
        } />
        <Row label="Plan" value="Trial (prueba gratuita)" />
        <Row label="Días restantes" value={`${dealer.trialDaysRemaining}`} highlight />
        <Row label="Vence" value={trialFmt} />
      </Card>
      <Card title="Documentación">
        {pending ? (
          <p style={{ margin: 0, color: '#ca8a04' }}>
            ⏳ Tu documentación está en revisión.
          </p>
        ) : rejected ? (
          <div>
            <p style={{ margin: '0 0 6px', color: '#E8390E', fontWeight: 700 }}>
              ✗ Documentación rechazada
            </p>
            {rejected.notes && (
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{rejected.notes}</p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#16a34a', fontWeight: 700 }}>
            ✓ Documentación aprobada
          </p>
        )}
      </Card>
      <Card title="Acciones rápidas">
        <Link href="/mi-tienda/perfil" style={btnLinkStyle}>Editar perfil</Link>
        {dealer.approvalStatus === 'approved' && (
          <a href={`/dealers/${dealer.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ ...btnLinkStyle, background: 'transparent', color: '#1E2340', border: '2px solid #1E2340' }}>
            Ver perfil público
          </a>
        )}
        <Link href="/publicar" style={{ ...btnLinkStyle, background: 'transparent', color: '#1E2340', border: '2px solid #1E2340' }}>
          + Publicar moto
        </Link>
      </Card>
    </div>
    </>
  )
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div style={{
      padding: '60px 20px', textAlign: 'center', color: '#666',
      background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: '6px',
    }}>
      <h3 style={{ margin: '0 0 8px', color: '#1E2340' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px' }}>{text}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #ececec', borderRadius: '6px', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
      <span style={{ fontSize: '13px', color: '#666' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '20px' : '14px',
        fontWeight: highlight ? 900 : 600,
        color: highlight ? '#E8390E' : '#1E2340',
      }}>{value}</span>
    </div>
  )
}

const btnLinkStyle: React.CSSProperties = {
  display: 'block',
  background: '#E8390E',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: '4px',
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  marginBottom: '8px',
}
