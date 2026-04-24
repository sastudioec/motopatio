import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { puedeCircularElDia } from '@/lib/picoyplaca'
import Banner from '@/app/components/Banner'
import Breadcrumb from '@/app/components/Breadcrumb'
import MotoCard from '@/app/components/MotoCard'
import Paginacion from '@/app/components/Paginacion'
import DestacadasBlock from './DestacadasBlock'
import { FiltrosSidebar, FiltrosMobileButton, SortSelect } from './FiltrosPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PER_PAGE = 24

type SearchParams = { [key: string]: string | string[] | undefined }
type Sort = 'recientes' | 'precio_asc' | 'precio_desc' | 'km_asc'

type Filtros = {
  buscar: string
  precioMin: number | null
  precioMax: number | null
  anioMin: number | null
  anioMax: number | null
  kmMax: number | null
  marcas: string[]
  provincia: string
  ciudad: string
  tipos: string[]
  cilindrajes: string[]
  picoyplaca: string
  soloElectricas: boolean
  sort: Sort
}

function one(sp: SearchParams, k: string): string {
  const v = sp[k]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}
function numOrNull(s: string): number | null {
  if (!s) return null
  const n = parseInt(s)
  return Number.isFinite(n) ? n : null
}
function csv(s: string): string[] {
  if (!s) return []
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

function parseFiltros(sp: SearchParams): Filtros {
  const rawSort = one(sp, 'sort')
  const validSorts: Sort[] = ['recientes', 'precio_asc', 'precio_desc', 'km_asc']
  const sort: Sort = (validSorts as string[]).includes(rawSort) ? (rawSort as Sort) : 'recientes'
  return {
    buscar: one(sp, 'buscar'),
    precioMin: numOrNull(one(sp, 'precioMin')),
    precioMax: numOrNull(one(sp, 'precioMax')),
    anioMin: numOrNull(one(sp, 'anioMin')),
    anioMax: numOrNull(one(sp, 'anioMax')),
    kmMax: numOrNull(one(sp, 'kmMax')),
    marcas: csv(one(sp, 'marcas')),
    provincia: one(sp, 'provincia'),
    ciudad: one(sp, 'ciudad'),
    tipos: csv(one(sp, 'tipos')),
    cilindrajes: csv(one(sp, 'cilindrajes')),
    picoyplaca: one(sp, 'picoyplaca'),
    soloElectricas: one(sp, 'soloElectricas') === '1',
    sort,
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildAndFilters(f: Filtros): any[] {
  const ands: any[] = []
  if (f.buscar) {
    ands.push({
      OR: [
        { marca: { contains: f.buscar } },
        { modelo: { contains: f.buscar } },
      ],
    })
  }
  if (f.soloElectricas) ands.push({ esElectrica: true })
  if (f.precioMin !== null) ands.push({ precio: { gte: f.precioMin } })
  if (f.precioMax !== null) ands.push({ precio: { lte: f.precioMax } })
  if (f.anioMin !== null) ands.push({ anio: { gte: f.anioMin } })
  if (f.anioMax !== null) ands.push({ anio: { lte: f.anioMax } })
  if (f.kmMax !== null) ands.push({ km: { lte: f.kmMax } })
  if (f.marcas.length) ands.push({ marca: { in: f.marcas } })
  if (f.provincia) ands.push({ provincia: f.provincia })
  if (f.ciudad) ands.push({ ciudad: f.ciudad })
  if (f.tipos.length) ands.push({ tipo: { in: f.tipos } })
  if (f.cilindrajes.length && !f.soloElectricas) ands.push({ cilindraje: { in: f.cilindrajes } })
  // NOTA: picoyplaca NO va al where; se aplica post-query client-side.
  return ands
}

function buildOrderBy(sort: Sort): any {
  switch (sort) {
    case 'precio_asc':
      return [{ precio: 'asc' }, { createdAt: 'desc' }]
    case 'precio_desc':
      return [{ precio: 'desc' }, { createdAt: 'desc' }]
    case 'km_asc':
      return [{ km: 'asc' }, { createdAt: 'desc' }]
    default:
      return [{ createdAt: 'desc' }]
  }
}

function buildPageHref(sp: SearchParams, page: number): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (k === 'page') continue
    if (v === undefined) continue
    const val = Array.isArray(v) ? v[0] : v
    if (val) qs.set(k, val)
  }
  if (page > 1) qs.set('page', String(page))
  const s = qs.toString()
  return '/motos' + (s ? '?' + s : '')
}

export default async function MotosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const filtros = parseFiltros(sp)
  const pageRaw = parseInt(one(sp, 'page') || '1')
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)
  const now = new Date()
  const andFilters = buildAndFilters(filtros)

  const destacadasWhere: any = {
    estado: 'activo',
    destacadoHasta: { gt: now },
    ...(andFilters.length ? { AND: andFilters } : {}),
  }
  const restoAnds = [
    ...andFilters,
    { OR: [{ destacadoHasta: null }, { destacadoHasta: { lte: now } }] },
  ]
  const restoWhere: any = { estado: 'activo', AND: restoAnds }

  const [destacadasDB, restoDB, restoCount, marcasDB] = await Promise.all([
    page === 1
      ? prisma.listing.findMany({
          where: destacadasWhere,
          orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
        })
      : Promise.resolve([] as any[]),
    prisma.listing.findMany({
      where: restoWhere,
      orderBy: buildOrderBy(filtros.sort),
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.listing.count({ where: restoWhere }),
    prisma.motoBrand.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  // Pico y Placa: filtro local post-query. Solo afecta lo visible en esta pagina,
  // no el contador total (advertencia junto al filtro).
  let destacadas = destacadasDB
  let resto = restoDB
  if (filtros.picoyplaca) {
    const dia = parseInt(filtros.picoyplaca)
    destacadas = destacadas.filter(m => puedeCircularElDia(m.placa || '', m.ciudad || '', dia))
    resto = resto.filter(m => puedeCircularElDia(m.placa || '', m.ciudad || '', dia))
  }

  const totalCount = (page === 1 ? destacadasDB.length : 0) + restoCount
  const totalPages = Math.max(1, Math.ceil(restoCount / PER_PAGE))
  const nombresMarcas = marcasDB.map(b => b.name)

  const initialFiltros = {
    buscar: filtros.buscar,
    precioMin: filtros.precioMin !== null ? String(filtros.precioMin) : '',
    precioMax: filtros.precioMax !== null ? String(filtros.precioMax) : '',
    anioMin: filtros.anioMin !== null ? String(filtros.anioMin) : '',
    anioMax: filtros.anioMax !== null ? String(filtros.anioMax) : '',
    kmMax: filtros.kmMax !== null ? String(filtros.kmMax) : '',
    marcas: filtros.marcas,
    provincia: filtros.provincia,
    ciudad: filtros.ciudad,
    tipos: filtros.tipos,
    cilindrajes: filtros.cilindrajes,
    picoyplaca: filtros.picoyplaca,
    soloElectricas: filtros.soloElectricas,
    sort: filtros.sort,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '14px',
  }
  const midBannerRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    margin: '20px 0',
  }
  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '14px',
  }
  const sectionBadge: React.CSSProperties = {
    background: '#E8390E',
    color: 'white',
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '7px 18px 7px 14px',
  }

  const paginaTieneDatos = resto.length > 0 || (page === 1 && destacadas.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Banner position="motos_hero" aspectRatio="4/1" />
        </div>
        <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Motos' }]} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '24px', fontWeight: 900, color: '#1E2340' }}>
              Motos en venta
            </h1>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
              {totalCount} motos encontradas
              {totalPages > 1 && (
                <span style={{ color: '#aaa' }}>{' · Página ' + page + ' de ' + totalPages}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FiltrosMobileButton initial={initialFiltros} marcasDB={nombresMarcas} />
            <SortSelect initial={filtros.sort} />
          </div>
        </div>

        <div
          className="motos-grid-2col"
          style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'flex-start' }}
        >
          <FiltrosSidebar initial={initialFiltros} marcasDB={nombresMarcas} />

          <div>
            {!paginaTieneDatos ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px',
                  background: '#fff',
                  borderRadius: '8px',
                  color: '#888',
                  border: '1px solid #e8e8e8',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                  No se encontraron motos con esos filtros
                </div>
                <Link
                  href="/motos"
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    background: '#E8390E',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Limpiar filtros
                </Link>
              </div>
            ) : (
              <>
                {page === 1 && destacadas.length > 0 && (
                  <>
                    <DestacadasBlock listings={destacadas} />
                    <div style={midBannerRowStyle}>
                      <Banner position="motos_mid_left" aspectRatio="4/1" />
                      <Banner position="motos_mid_right" aspectRatio="4/1" />
                    </div>
                  </>
                )}

                <div style={sectionHeaderStyle}>
                  <div style={sectionBadge}>
                    {page === 1 && destacadas.length > 0 ? 'Motos Recientes' : 'Motos en venta'}
                  </div>
                  <div style={{ flex: 1, height: '2px', background: '#e0e0e0' }} />
                </div>

                {resto.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '13px' }}>
                    {page === 1
                      ? 'Todas las motos activas están destacadas.'
                      : 'No hay más motos en esta página.'}
                  </div>
                ) : (
                  <div style={gridStyle}>
                    {resto.map(l => <MotoCard key={l.id} l={l} />)}
                  </div>
                )}

                <Paginacion
                  currentPage={page}
                  totalPages={totalPages}
                  buildHref={p => buildPageHref(sp, p)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .motos-grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
