/**
 * Parser server-safe de los query params `desde` y `hasta` que usan los
 * filtros de fechas de leads. Acepta YYYY-MM-DD; cualquier otro formato
 * se ignora silenciosamente.
 *
 * Devuelve los limites como Date listos para usar en Prisma:
 *   - `desde` = 00:00:00 del dia
 *   - `hasta` = 23:59:59.999 del dia (inclusivo)
 */
export function parseDateRange(searchParams: { desde?: string | null; hasta?: string | null }): {
  gte?: Date
  lte?: Date
} {
  const out: { gte?: Date; lte?: Date } = {}
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (searchParams.desde && re.test(searchParams.desde)) {
    const d = new Date(searchParams.desde + 'T00:00:00.000Z')
    if (!Number.isNaN(d.getTime())) out.gte = d
  }
  if (searchParams.hasta && re.test(searchParams.hasta)) {
    const d = new Date(searchParams.hasta + 'T23:59:59.999Z')
    if (!Number.isNaN(d.getTime())) out.lte = d
  }
  return out
}

/**
 * WHERE clause Prisma para Lead.createdAt segun rango. Vacia si no hay.
 */
export function dateRangeWhereCreatedAt(searchParams: {
  desde?: string | null
  hasta?: string | null
}): { createdAt?: { gte?: Date; lte?: Date } } {
  const r = parseDateRange(searchParams)
  if (!r.gte && !r.lte) return {}
  return { createdAt: r }
}
