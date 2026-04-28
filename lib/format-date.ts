// Helpers de formateo de fecha. Siempre fuerzan timeZone='America/Guayaquil'
// (UTC-5) tanto en server como en cliente, sin depender del TZ del proceso
// ni del navegador. Esto evita el bug histórico donde el server (UTC) mostraba
// las fechas +5h respecto a Ecuador.
//
// Convención: cualquier fecha visible al usuario pasa por uno de estos
// helpers. Para timestamps internos (logs, IDs, ISO), usar Date directo.

const TZ = 'America/Guayaquil'

type DateInput = Date | string | number | null | undefined

function toDate(d: DateInput): Date | null {
  if (d === null || d === undefined || d === '') return null
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Ej: "28 abr 2026" */
export function formatFechaCorta(d: DateInput): string {
  const date = toDate(d)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Ej: "28 abr 2026, 12:54 p. m." */
export function formatFechaHora(d: DateInput): string {
  const date = toDate(d)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Ej: "28/4/26, 12:54" — formato compacto para tablas y CSV */
export function formatFechaCortaHora(d: DateInput): string {
  const date = toDate(d)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

/** Ej: "28 de abril de 2026" — para cuerpos de email y mensajes formales */
export function formatFechaLarga(d: DateInput): string {
  const date = toDate(d)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
