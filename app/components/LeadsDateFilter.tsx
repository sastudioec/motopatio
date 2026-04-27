'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

function todayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
function nDaysAgoIso(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * Filtro de rango de fechas reutilizable. Sincroniza con URL search params:
 *   ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Mantiene el resto de los query params al navegar (filtros existentes).
 */
export default function LeadsDateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [desde, setDesde] = useState(sp.get('desde') || '')
  const [hasta, setHasta] = useState(sp.get('hasta') || '')

  useEffect(() => {
    setDesde(sp.get('desde') || '')
    setHasta(sp.get('hasta') || '')
  }, [sp])

  function navigateWith(d: string, h: string) {
    const next = new URLSearchParams(sp.toString())
    if (d) next.set('desde', d); else next.delete('desde')
    if (h) next.set('hasta', h); else next.delete('hasta')
    const s = next.toString()
    router.push(pathname + (s ? '?' + s : ''))
  }

  function quickToday() {
    const t = todayIso()
    setDesde(t); setHasta(t); navigateWith(t, t)
  }
  function quick7d() {
    const d = nDaysAgoIso(6)
    const h = todayIso()
    setDesde(d); setHasta(h); navigateWith(d, h)
  }
  function quickMonth() {
    const d = nDaysAgoIso(29)
    const h = todayIso()
    setDesde(d); setHasta(h); navigateWith(d, h)
  }
  function clearAll() {
    setDesde(''); setHasta(''); navigateWith('', '')
  }
  function apply() {
    navigateWith(desde, hasta)
  }

  const hasFilter = !!(sp.get('desde') || sp.get('hasta'))

  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      background: '#fafafa', border: '1px solid #ececec', borderRadius: 6,
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={lblQuick}>Desde</label>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={inp} />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={lblQuick}>Hasta</label>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={inp} />
      </div>
      <button onClick={apply} style={btnApply}>Aplicar</button>
      <span style={{ width: 1, height: 22, background: '#d0d0d0', margin: '0 4px' }} aria-hidden="true" />
      <button onClick={quickToday} style={btnQuick}>Hoy</button>
      <button onClick={quick7d} style={btnQuick}>Últimos 7 días</button>
      <button onClick={quickMonth} style={btnQuick}>Último mes</button>
      <button onClick={clearAll} style={hasFilter ? btnQuickActive : btnQuick}>
        {hasFilter ? 'Limpiar' : 'Todos'}
      </button>
    </div>
  )
}

const lblQuick: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase' }
const inp: React.CSSProperties = {
  padding: '6px 8px', fontSize: 12, border: '1px solid #d0d0d0',
  borderRadius: 4, fontFamily: 'inherit',
}
const btnQuick: React.CSSProperties = {
  background: '#fff', color: '#1E2340', border: '1px solid #d0d0d0',
  padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 4,
  cursor: 'pointer', textTransform: 'uppercase',
}
const btnQuickActive: React.CSSProperties = {
  ...btnQuick, color: '#E8390E', borderColor: '#E8390E',
}
const btnApply: React.CSSProperties = {
  background: '#1E2340', color: '#fff', border: 'none',
  padding: '6px 14px', fontSize: 11, fontWeight: 800, borderRadius: 4,
  cursor: 'pointer', textTransform: 'uppercase',
}
