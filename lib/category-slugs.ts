import { slugify } from './slug'
import { PROVINCIAS_ECUADOR } from './provincias-ecuador'

type Tipo = {
  db: string
  slug: string
  singular: string
  plural: string
}

const TIPOS: Tipo[] = [
  { db: 'Urbana',          slug: 'urbanas',         singular: 'urbana',         plural: 'urbanas' },
  { db: 'Naked',           slug: 'naked',           singular: 'naked',          plural: 'naked' },
  { db: 'Trail/Enduro',    slug: 'trail-enduro',    singular: 'trail/enduro',   plural: 'trail y enduro' },
  { db: 'Scooter',         slug: 'scooters',        singular: 'scooter',        plural: 'scooters' },
  { db: 'Deportiva',       slug: 'deportivas',      singular: 'deportiva',      plural: 'deportivas' },
  { db: 'Crucero',         slug: 'cruceros',        singular: 'crucero',        plural: 'cruceros' },
  { db: 'Touring',         slug: 'touring',         singular: 'touring',        plural: 'touring' },
  { db: 'Doble propósito', slug: 'doble-proposito', singular: 'doble propósito', plural: 'doble propósito' },
  { db: 'Clásica',         slug: 'clasicas',        singular: 'clásica',        plural: 'clásicas' },
  { db: 'Cuadrón',         slug: 'cuadrones',       singular: 'cuadrón',        plural: 'cuadrones' },
]

export function getTipoBySlug(slug: string): Tipo | null {
  return TIPOS.find(t => t.slug === slug) ?? null
}

export function getTipoByDb(dbName: string): Tipo | null {
  return TIPOS.find(t => t.db === dbName) ?? null
}

export function tipoSlugFromDb(dbName: string): string {
  return TIPOS.find(t => t.db === dbName)?.slug ?? slugify(dbName)
}

export const ALL_TIPOS = TIPOS

type Ciudad = { db: string; slug: string }

const CIUDADES_SET: Ciudad[] = (() => {
  const map = new Map<string, string>()
  for (const p of PROVINCIAS_ECUADOR) {
    for (const c of p.ciudades) {
      if (c === 'Otra' || map.has(c)) continue
      map.set(c, slugify(c))
    }
  }
  return Array.from(map.entries()).map(([db, slug]) => ({ db, slug }))
})()

export function getCiudadBySlug(slug: string): Ciudad | null {
  return CIUDADES_SET.find(c => c.slug === slug) ?? null
}

export function ciudadSlugFromDb(dbName: string): string {
  return CIUDADES_SET.find(c => c.db === dbName)?.slug ?? slugify(dbName)
}

export const ALL_CIUDADES = CIUDADES_SET
