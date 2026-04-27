import { prisma } from '@/lib/prisma'
import { getTipoByDb, ciudadSlugFromDb, tipoSlugFromDb } from '@/lib/category-slugs'

export type ScoredListing = {
  l: Awaited<ReturnType<typeof prisma.listing.findFirst>> & object
  score: number
  matchMarca: boolean
  matchTipo: boolean
  matchCiudad: boolean
}

const N_TOP = 8 // cantidad maxima a mostrar en el bloque
const N_MIN = 3 // minimo para que valga la pena renderizar
const N_RECOMMENDED = 6 // si hay menos que esto, rellenar con motos generales
const PLAN_RANK: Record<string, number> = { full: 3, basico: 2, gratis: 1 }

type MotoLike = {
  id: string
  marca: string
  tipo: string | null
  ciudad: string | null
  userId: string
}

/**
 * Obtiene motos relacionadas con scoring por coincidencia de marca/tipo/ciudad.
 * Excluye la moto actual y motos del mismo vendedor (variedad).
 *
 * Estrategia:
 *  1. Universo: hasta 50 candidatos con al menos UNA coincidencia (marca, tipo o ciudad).
 *  2. Scoring: +1 por cada dimension coincidente. Tie-break por planTipo (Full > Basico > Gratis), luego createdAt desc.
 *  3. Si tras filtros hay menos de N_RECOMMENDED, rellenar con motos generales (recientes/destacadas) hasta N_TOP.
 *  4. Si en total no llega a N_MIN, devolver lista vacia → caller oculta el bloque.
 */
export async function getRelatedListings(moto: MotoLike): Promise<ScoredListing[]> {
  const orClauses: object[] = [{ marca: moto.marca }]
  if (moto.tipo) orClauses.push({ tipo: moto.tipo })
  if (moto.ciudad) orClauses.push({ ciudad: moto.ciudad })

  const candidates = await prisma.listing.findMany({
    where: {
      estado: 'activo',
      id: { not: moto.id },
      userId: { not: moto.userId },
      OR: orClauses,
      AND: [{ OR: [
        { dealerId: null },
        { dealer: { is: { approvalStatus: 'approved', activo: true } } },
      ] }],
    },
    take: 50,
    orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
  })

  const scored: ScoredListing[] = candidates.map((l) => {
    const matchMarca = l.marca === moto.marca
    const matchTipo = !!moto.tipo && l.tipo === moto.tipo
    const matchCiudad = !!moto.ciudad && l.ciudad === moto.ciudad
    const score = (matchMarca ? 1 : 0) + (matchTipo ? 1 : 0) + (matchCiudad ? 1 : 0)
    return { l, score, matchMarca, matchTipo, matchCiudad }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const planA = PLAN_RANK[a.l.planTipo || 'gratis'] || 0
    const planB = PLAN_RANK[b.l.planTipo || 'gratis'] || 0
    if (planB !== planA) return planB - planA
    return new Date(b.l.createdAt).getTime() - new Date(a.l.createdAt).getTime()
  })

  let related = scored.slice(0, N_TOP)

  // Relleno: si el bloque luce ralo, completar con motos generales recientes
  // (sin coincidencia). Excluye la moto actual, mismo vendedor, y las ya incluidas.
  if (related.length < N_RECOMMENDED) {
    const excludeIds = new Set(related.map((r) => r.l.id))
    excludeIds.add(moto.id)
    const filler = await prisma.listing.findMany({
      where: {
        estado: 'activo',
        userId: { not: moto.userId },
        id: { notIn: Array.from(excludeIds) },
        AND: [{ OR: [
          { dealerId: null },
          { dealer: { is: { approvalStatus: 'approved', activo: true } } },
        ] }],
      },
      take: N_TOP - related.length,
      orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
    })
    for (const l of filler) {
      related.push({
        l,
        score: 0,
        matchMarca: false,
        matchTipo: false,
        matchCiudad: false,
      })
    }
  }

  if (related.length < N_MIN) return []
  return related
}

export type Chip = { label: string; href: string }

export type RelatedHeader = {
  title: string
  chips: Chip[]
}

/**
 * Deriva titulo dinamico segun que dimension predomina en el top, y arma
 * 2-3 chips a paginas de categoria relevantes. Los chips son CRITICOS
 * para SEO porque dan a Google los links internos a las paginas de
 * categoria desde la pagina de detalle.
 */
export function deriveHeader(
  moto: MotoLike & { marca: string },
  related: ScoredListing[],
  marcaSlug: string | null
): RelatedHeader {
  const N = related.length
  const half = Math.ceil(N / 2)
  let countMarcaCiudad = 0
  let countTipoCiudad = 0
  let countMarca = 0
  let countTipo = 0
  let countCiudad = 0
  for (const r of related) {
    if (r.matchMarca && r.matchCiudad) countMarcaCiudad++
    if (r.matchTipo && r.matchCiudad) countTipoCiudad++
    if (r.matchMarca) countMarca++
    if (r.matchTipo) countTipo++
    if (r.matchCiudad) countCiudad++
  }

  const tipoInfo = moto.tipo ? getTipoByDb(moto.tipo) : null
  const tipoPlural = tipoInfo?.plural || moto.tipo || ''
  const tipoSlug = moto.tipo ? tipoSlugFromDb(moto.tipo) : null
  const ciudadSlug = moto.ciudad ? ciudadSlugFromDb(moto.ciudad) : null

  let title = 'Otras motos que te pueden interesar'
  if (countMarcaCiudad >= half && moto.ciudad) {
    title = `Más ${moto.marca} en ${moto.ciudad}`
  } else if (countTipoCiudad >= half && moto.ciudad && tipoPlural) {
    title = `Más motos ${tipoPlural} en ${moto.ciudad}`
  } else if (countMarca >= half) {
    title = `Más ${moto.marca}`
  } else if (countTipo >= half && tipoPlural) {
    title = `Más motos ${tipoPlural}`
  } else if (countCiudad >= half && moto.ciudad) {
    title = `Más motos en ${moto.ciudad}`
  }

  const chips: Chip[] = []
  const seenHrefs = new Set<string>()
  const push = (label: string, href: string) => {
    if (seenHrefs.has(href)) return
    seenHrefs.add(href)
    chips.push({ label, href })
  }

  if (marcaSlug && ciudadSlug && moto.ciudad) {
    push(`Ver todas las ${moto.marca} en ${moto.ciudad}`, `/motos/marca/${marcaSlug}/ciudad/${ciudadSlug}`)
  }
  if (marcaSlug) {
    push(`Ver todas las ${moto.marca}`, `/motos/marca/${marcaSlug}`)
  }
  if (tipoSlug && tipoInfo) {
    push(`Ver todas las motos ${tipoInfo.plural}`, `/motos/tipo/${tipoSlug}`)
  }
  if (ciudadSlug && moto.ciudad) {
    push(`Ver todas en ${moto.ciudad}`, `/motos/ciudad/${ciudadSlug}`)
  }

  return { title, chips: chips.slice(0, 3) }
}
