import { prisma } from './prisma'
import { ciudadSlugFromDb, tipoSlugFromDb } from './category-slugs'
import { slugify } from './slug'

type GroupOpts = { limit?: number }

async function attachBrandSlugs(rows: { name: string; count: number }[]) {
  if (rows.length === 0) return []
  const brands = await prisma.motoBrand.findMany({
    where: { name: { in: rows.map(r => r.name) } },
    select: { name: true, slug: true },
  })
  const slugByName = new Map(brands.map(b => [b.name, b.slug]))
  return rows.map(r => ({ ...r, slug: slugByName.get(r.name) ?? slugify(r.name) }))
}

export async function getTopActiveMarcas(opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['marca'],
    where: { estado: 'activo' },
    _count: { _all: true },
    orderBy: { _count: { marca: 'desc' } },
    take: opts.limit ?? 12,
  })
  return attachBrandSlugs(rows.map(r => ({ name: r.marca, count: r._count._all })))
}

export async function getTopActiveCiudades(opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['ciudad'],
    where: { estado: 'activo' },
    _count: { _all: true },
    orderBy: { _count: { ciudad: 'desc' } },
    take: opts.limit ?? 12,
  })
  return rows.map(r => ({
    name: r.ciudad,
    slug: ciudadSlugFromDb(r.ciudad),
    count: r._count._all,
  }))
}

export async function getTopActiveTipos(opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['tipo'],
    where: { estado: 'activo' },
    _count: { _all: true },
    orderBy: { _count: { tipo: 'desc' } },
    take: opts.limit ?? 12,
  })
  return rows.map(r => ({
    name: r.tipo,
    slug: tipoSlugFromDb(r.tipo),
    count: r._count._all,
  }))
}

export async function getCiudadesForMarca(marca: string, opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['ciudad'],
    where: { estado: 'activo', marca },
    _count: { _all: true },
    orderBy: { _count: { ciudad: 'desc' } },
    take: opts.limit ?? 8,
  })
  return rows.map(r => ({
    name: r.ciudad,
    slug: ciudadSlugFromDb(r.ciudad),
    count: r._count._all,
  }))
}

export async function getMarcasForCiudad(ciudad: string, opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['marca'],
    where: { estado: 'activo', ciudad },
    _count: { _all: true },
    orderBy: { _count: { marca: 'desc' } },
    take: opts.limit ?? 8,
  })
  return attachBrandSlugs(rows.map(r => ({ name: r.marca, count: r._count._all })))
}

export async function getCiudadesForTipo(tipo: string, opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['ciudad'],
    where: { estado: 'activo', tipo },
    _count: { _all: true },
    orderBy: { _count: { ciudad: 'desc' } },
    take: opts.limit ?? 8,
  })
  return rows.map(r => ({
    name: r.ciudad,
    slug: ciudadSlugFromDb(r.ciudad),
    count: r._count._all,
  }))
}

export async function getTiposForCiudad(ciudad: string, opts: GroupOpts = {}) {
  const rows = await prisma.listing.groupBy({
    by: ['tipo'],
    where: { estado: 'activo', ciudad },
    _count: { _all: true },
    orderBy: { _count: { tipo: 'desc' } },
    take: opts.limit ?? 8,
  })
  return rows.map(r => ({
    name: r.tipo,
    slug: tipoSlugFromDb(r.tipo),
    count: r._count._all,
  }))
}

export async function getActiveMarcaCiudadCombos() {
  return prisma.listing.groupBy({
    by: ['marca', 'ciudad'],
    where: { estado: 'activo' },
    _count: { _all: true },
  })
}

export async function getActiveTipoCiudadCombos() {
  return prisma.listing.groupBy({
    by: ['tipo', 'ciudad'],
    where: { estado: 'activo' },
    _count: { _all: true },
  })
}
