'use client'
import { useEffect, useMemo, useRef, useState, useTransition, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PROVINCIAS_ECUADOR } from '@/lib/provincias-ecuador'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Filtros = {
  buscar: string
  precioMin: string
  precioMax: string
  anioMin: string
  anioMax: string
  kmMax: string
  marcas: string[]
  provincia: string
  ciudad: string
  tipos: string[]
  cilindrajes: string[]
  picoyplaca: string
  soloElectricas: boolean
  sort: string
}

export const EMPTY_FILTROS: Filtros = {
  buscar: '', precioMin: '', precioMax: '', anioMin: '', anioMax: '', kmMax: '',
  marcas: [], provincia: '', ciudad: '', tipos: [], cilindrajes: [],
  picoyplaca: '', soloElectricas: false, sort: 'recientes',
}

const TIPOS = ['Urbana', 'Naked', 'Trail/Enduro', 'Scooter', 'Deportiva', 'Crucero', 'Touring', 'Doble propósito']
const CILINDRAJES = ['50cc', '100cc', '110cc', '125cc', '150cc', '160cc', '200cc', '250cc', '300cc', '400cc', '500cc', '600cc', '650cc', '700cc+']
const DIAS = [
  { v: '1', label: 'Lunes' },
  { v: '2', label: 'Martes' },
  { v: '3', label: 'Miércoles' },
  { v: '4', label: 'Jueves' },
  { v: '5', label: 'Viernes' },
]
const PROVINCIAS_NOMBRES = PROVINCIAS_ECUADOR.map((p: any) => p.nombre).sort((a: string, b: string) => a.localeCompare(b))

function buildQueryString(f: Filtros): string {
  const qs = new URLSearchParams()
  if (f.buscar) qs.set('buscar', f.buscar)
  if (f.precioMin) qs.set('precioMin', f.precioMin)
  if (f.precioMax) qs.set('precioMax', f.precioMax)
  if (f.anioMin) qs.set('anioMin', f.anioMin)
  if (f.anioMax) qs.set('anioMax', f.anioMax)
  if (f.kmMax) qs.set('kmMax', f.kmMax)
  if (f.marcas.length) qs.set('marcas', f.marcas.join(','))
  if (f.provincia) qs.set('provincia', f.provincia)
  if (f.ciudad) qs.set('ciudad', f.ciudad)
  if (f.tipos.length) qs.set('tipos', f.tipos.join(','))
  if (f.cilindrajes.length) qs.set('cilindrajes', f.cilindrajes.join(','))
  if (f.picoyplaca) qs.set('picoyplaca', f.picoyplaca)
  if (f.soloElectricas) qs.set('soloElectricas', '1')
  if (f.sort && f.sort !== 'recientes') qs.set('sort', f.sort)
  // Al cambiar filtros volvemos a pagina 1 (no seteamos page).
  const s = qs.toString()
  return s ? '?' + s : ''
}

function parseFromUrl(sp: URLSearchParams): Filtros {
  return {
    buscar: sp.get('buscar') || '',
    precioMin: sp.get('precioMin') || '',
    precioMax: sp.get('precioMax') || '',
    anioMin: sp.get('anioMin') || '',
    anioMax: sp.get('anioMax') || '',
    kmMax: sp.get('kmMax') || '',
    marcas: (sp.get('marcas') || '').split(',').filter(Boolean),
    provincia: sp.get('provincia') || '',
    ciudad: sp.get('ciudad') || '',
    tipos: (sp.get('tipos') || '').split(',').filter(Boolean),
    cilindrajes: (sp.get('cilindrajes') || '').split(',').filter(Boolean),
    picoyplaca: sp.get('picoyplaca') || '',
    soloElectricas: sp.get('soloElectricas') === '1',
    sort: sp.get('sort') || 'recientes',
  }
}

type FiltrosState = {
  filtros: Filtros
  update: (patch: Partial<Filtros>, opts?: { immediate?: boolean }) => void
  limpiar: () => void
  flush: () => void
  seccionesAbiertas: {
    precio: boolean; anio: boolean; km: boolean; marcas: boolean;
    ubicacion: boolean; tipos: boolean; cilindrajes: boolean; picoyplaca: boolean;
  }
  toggleSec: (k: keyof FiltrosState['seccionesAbiertas']) => void
}

function useFiltrosState(initial: Filtros): FiltrosState {
  const router = useRouter()
  const pathname = usePathname()
  const urlSp = useSearchParams()
  const [filtros, setFiltros] = useState<Filtros>(initial)
  const [, startTransition] = useTransition()
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    precio: true, anio: true, km: false, marcas: false, ubicacion: true,
    tipos: false, cilindrajes: false, picoyplaca: false,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSyncRef = useRef(false)
  const filtrosRef = useRef(filtros)
  filtrosRef.current = filtros

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }
    setFiltros(parseFromUrl(urlSp))
  }, [urlSp])

  const pushToUrl = (next: Filtros) => {
    skipNextSyncRef.current = true
    const qs = buildQueryString(next)
    startTransition(() => {
      router.replace(pathname + qs, { scroll: false })
    })
  }

  const update = (patch: Partial<Filtros>, opts: { immediate?: boolean } = {}) => {
    setFiltros(prev => {
      const next = { ...prev, ...patch }
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (opts.immediate) {
        pushToUrl(next)
      } else {
        debounceRef.current = setTimeout(() => pushToUrl(next), 350)
      }
      return next
    })
  }

  const limpiar = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFiltros(EMPTY_FILTROS)
    skipNextSyncRef.current = true
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const flush = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    pushToUrl(filtrosRef.current)
  }

  const toggleSec = (k: keyof typeof seccionesAbiertas) =>
    setSeccionesAbiertas(s => ({ ...s, [k]: !s[k] }))

  return { filtros, update, limpiar, flush, seccionesAbiertas, toggleSec }
}

function PanelUI({ state, marcasDB, onSubmit }: { state: FiltrosState; marcasDB: string[]; onSubmit?: () => void }) {
  const { filtros, update, limpiar, seccionesAbiertas, toggleSec } = state
  const toggleArr = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
  const onTextEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }

  const ciudadesDeProvincia = useMemo(() => {
    if (!filtros.provincia) return [] as string[]
    const prov = PROVINCIAS_ECUADOR.find((p: any) => p.nombre === filtros.provincia)
    return prov ? [...prov.ciudades].sort((a: string, b: string) => a.localeCompare(b)) : []
  }, [filtros.provincia])

  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E2340', textTransform: 'uppercase', marginBottom: '10px' }}>
          Buscar
        </div>
        <input
          value={filtros.buscar}
          onChange={e => update({ buscar: e.target.value })}
          onKeyDown={onTextEnter}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
          placeholder="Marca o modelo..."
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer', fontSize: '13px', color: '#1E2340', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={filtros.soloElectricas}
            onChange={e => update({ soloElectricas: e.target.checked }, { immediate: true })}
            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
          />
          ⚡ Solo eléctricas
        </label>
      </div>

      <Acordeon titulo="Ubicación" abierto={seccionesAbiertas.ubicacion} onToggle={() => toggleSec('ubicacion')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <select
            value={filtros.provincia}
            onChange={e => update({ provincia: e.target.value, ciudad: '' }, { immediate: true })}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS_NOMBRES.map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filtros.ciudad}
            onChange={e => update({ ciudad: e.target.value }, { immediate: true })}
            disabled={!filtros.provincia}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', background: filtros.provincia ? '#fff' : '#f4f4f4', color: filtros.provincia ? '#333' : '#999' }}
          >
            <option value="">{filtros.provincia ? 'Todas las ciudades' : 'Elige provincia primero'}</option>
            {ciudadesDeProvincia.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Acordeon>

      <Acordeon titulo="Precio" abierto={seccionesAbiertas.precio} onToggle={() => toggleSec('precio')}>
        <DosInputs
          a={filtros.precioMin} setA={(v: string) => update({ precioMin: v })} placeA="Desde"
          b={filtros.precioMax} setB={(v: string) => update({ precioMax: v })} placeB="Hasta"
          onSubmit={onSubmit}
        />
      </Acordeon>

      <Acordeon titulo="Año" abierto={seccionesAbiertas.anio} onToggle={() => toggleSec('anio')}>
        <DosInputs
          a={filtros.anioMin} setA={(v: string) => update({ anioMin: v })} placeA="Desde"
          b={filtros.anioMax} setB={(v: string) => update({ anioMax: v })} placeB="Hasta"
          onSubmit={onSubmit}
        />
      </Acordeon>

      <Acordeon titulo="Kilometraje" abierto={seccionesAbiertas.km} onToggle={() => toggleSec('km')}>
        <select
          value={filtros.kmMax}
          onChange={e => update({ kmMax: e.target.value }, { immediate: true })}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
        >
          <option value="">Cualquier</option>
          <option value="5000">Hasta 5,000 km</option>
          <option value="10000">Hasta 10,000 km</option>
          <option value="20000">Hasta 20,000 km</option>
          <option value="50000">Hasta 50,000 km</option>
          <option value="100000">Hasta 100,000 km</option>
        </select>
      </Acordeon>

      <Acordeon titulo="Pico y Placa Quito" abierto={seccionesAbiertas.picoyplaca} onToggle={() => toggleSec('picoyplaca')}>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', lineHeight: 1.4 }}>
          Ver motos que puedes circular este día:
        </div>
        <select
          value={filtros.picoyplaca}
          onChange={e => update({ picoyplaca: e.target.value }, { immediate: true })}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
        >
          <option value="">Mostrar todas</option>
          {DIAS.map(d => <option key={d.v} value={d.v}>Puedo usar el {d.label}</option>)}
        </select>
        {filtros.picoyplaca && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#B45309', lineHeight: 1.4 }}>
            Filtro local · resultados y contador aproximados.
          </div>
        )}
      </Acordeon>

      <Acordeon titulo={'Marcas' + (filtros.marcas.length ? ' (' + filtros.marcas.length + ')' : '')} abierto={seccionesAbiertas.marcas} onToggle={() => toggleSec('marcas')}>
        {marcasDB.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#888' }}>Sin marcas</div>
        ) : (
          <Checks
            items={marcasDB}
            selected={filtros.marcas}
            onChange={(v: string) => update({ marcas: toggleArr(filtros.marcas, v) }, { immediate: true })}
          />
        )}
      </Acordeon>

      <Acordeon titulo={'Tipo' + (filtros.tipos.length ? ' (' + filtros.tipos.length + ')' : '')} abierto={seccionesAbiertas.tipos} onToggle={() => toggleSec('tipos')}>
        <Checks
          items={TIPOS}
          selected={filtros.tipos}
          onChange={(v: string) => update({ tipos: toggleArr(filtros.tipos, v) }, { immediate: true })}
        />
      </Acordeon>

      {!filtros.soloElectricas && (
        <Acordeon titulo={'Cilindraje' + (filtros.cilindrajes.length ? ' (' + filtros.cilindrajes.length + ')' : '')} abierto={seccionesAbiertas.cilindrajes} onToggle={() => toggleSec('cilindrajes')}>
          <Checks
            items={CILINDRAJES}
            selected={filtros.cilindrajes}
            onChange={(v: string) => update({ cilindrajes: toggleArr(filtros.cilindrajes, v) }, { immediate: true })}
          />
        </Acordeon>
      )}

      <div style={{ padding: '16px' }}>
        <button
          onClick={limpiar}
          style={{ width: '100%', padding: '10px', background: '#f4f4f4', color: '#666', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  )
}

type Props = {
  initial: Filtros
  marcasDB: string[]
  totalCount: number
}

function scrollToResults() {
  if (typeof document === 'undefined') return
  document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Sidebar sticky con filtros. Visible solo desktop (hidden via CSS en mobile).
 * Lee y escribe filtros en el querystring de la URL.
 */
export function FiltrosSidebar({ initial, marcasDB, totalCount }: Props) {
  const state = useFiltrosState(initial)
  const onEnterSubmit = () => {
    state.flush()
    scrollToResults()
  }
  return (
    <aside
      className="filtros-sidebar"
      style={{ position: 'sticky', top: '86px' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px', padding: '0 2px' }}>
        <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E2340' }}>Filtros</span>
        <span style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>· {totalCount} motos</span>
      </div>
      <PanelUI state={state} marcasDB={marcasDB} onSubmit={onEnterSubmit} />
      <style jsx>{`
        @media (max-width: 768px) {
          .filtros-sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  )
}

/**
 * Boton "☰ Filtros" que abre un drawer con los mismos filtros que la sidebar.
 * Visible solo mobile. Instancia independiente de la sidebar pero sincronizada
 * a traves de la URL.
 */
export function FiltrosMobileButton({ initial, marcasDB, totalCount }: Props) {
  const state = useFiltrosState(initial)
  const [open, setOpen] = useState(false)

  const goToResults = () => {
    state.flush()
    setOpen(false)
    scrollToResults()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="filtros-mobile-btn"
        style={{ background: '#1E2340', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
      >
        ☰ Filtros
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '85%', maxWidth: 'min(360px, 100vw)', background: '#f4f4f4', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', flexShrink: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E2340' }}>Filtros</div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 16px 16px' }}>
              <PanelUI state={state} marcasDB={marcasDB} onSubmit={goToResults} />
            </div>
            <button
              onClick={goToResults}
              style={{ width: '100%', height: '56px', background: '#E8390E', color: 'white', border: 'none', borderRadius: 0, fontSize: '15px', fontWeight: 800, cursor: 'pointer', flexShrink: 0, textAlign: 'center' }}
            >
              Ver {totalCount} motos
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        @media (min-width: 769px) {
          .filtros-mobile-btn { display: none !important; }
        }
      `}</style>
    </>
  )
}

export function SortSelect({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSp = useSearchParams()
  const [value, setValue] = useState(initial)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setValue(urlSp.get('sort') || 'recientes')
  }, [urlSp])

  const onChange = (v: string) => {
    setValue(v)
    const qs = new URLSearchParams(urlSp.toString())
    if (v && v !== 'recientes') qs.set('sort', v)
    else qs.delete('sort')
    qs.delete('page')
    const s = qs.toString()
    startTransition(() => {
      router.replace(pathname + (s ? '?' + s : ''), { scroll: false })
    })
  }

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', background: '#fff' }}
    >
      <option value="recientes">Más recientes</option>
      <option value="precio_asc">Precio menor a mayor</option>
      <option value="precio_desc">Precio mayor a menor</option>
      <option value="km_asc">Menor kilometraje</option>
    </select>
  )
}

/* ---------- Subcomponentes UI ---------- */

function Acordeon({ titulo, abierto, onToggle, children }: { titulo: string; abierto: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #f0f0f0' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#1E2340', textAlign: 'left' }}
      >
        <span>{titulo}</span>
        <span style={{ fontSize: '16px', color: '#E8390E', fontWeight: 700 }}>{abierto ? '−' : '+'}</span>
      </button>
      {abierto && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  )
}

function DosInputs({ a, setA, placeA, b, setB, placeB, onSubmit }: { a: string; setA: (v: string) => void; placeA: string; b: string; setB: (v: string) => void; placeB: string; onSubmit?: () => void }) {
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <input
        value={a}
        onChange={e => setA(e.target.value.replace(/\D/g, ''))}
        onKeyDown={onEnter}
        placeholder={placeA}
        style={{ flex: 1, padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
      />
      <input
        value={b}
        onChange={e => setB(e.target.value.replace(/\D/g, ''))}
        onKeyDown={onEnter}
        placeholder={placeB}
        style={{ flex: 1, padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function Checks({ items, selected, onChange }: { items: string[]; selected: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
      {items.map(it => (
        <label key={it} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#333', cursor: 'pointer', padding: '2px 0' }}>
          <input type="checkbox" checked={selected.includes(it)} onChange={() => onChange(it)} style={{ cursor: 'pointer' }} />
          {it}
        </label>
      ))}
    </div>
  )
}
