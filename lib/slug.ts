export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildListingSlug(l: {
  marca: string
  modelo: string
  anio: number | string
  ciudad?: string | null
  id: string
}): string {
  const parts = [l.marca, l.modelo, String(l.anio)]
  if (l.ciudad) parts.push(l.ciudad)
  const base = parts.map(slugify).filter(Boolean).join('-')
  const short = l.id.slice(-6).toLowerCase()
  return base ? `${base}-${short}` : short
}
