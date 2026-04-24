import Link from 'next/link'

type Props = {
  currentPage: number
  totalPages: number
  /** Dada una pagina, devuelve el href al que el <Link> debe apuntar. */
  buildHref: (page: number) => string
}

/**
 * Ventana de paginas a mostrar. Total <= 7 muestra todas. Si no,
 * muestra 1 + vecinos de current + total con gaps cuando corresponde.
 */
function windowPages(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | 'gap')[] = [1]
  if (current > 3) out.push('gap')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let p = start; p <= end; p++) out.push(p)
  if (current < total - 2) out.push('gap')
  out.push(total)
  return out
}

export default function Paginacion({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null
  const pages = windowPages(currentPage, totalPages)
  const prev = currentPage > 1 ? currentPage - 1 : null
  const next = currentPage < totalPages ? currentPage + 1 : null

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '38px',
    height: '38px',
    padding: '0 12px',
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#1E2340',
    fontSize: '13px',
    fontWeight: 700,
    borderRadius: '4px',
    textDecoration: 'none',
  }
  const active: React.CSSProperties = {
    ...btn,
    background: '#1E2340',
    color: '#fff',
    borderColor: '#1E2340',
  }
  const disabled: React.CSSProperties = {
    ...btn,
    opacity: 0.4,
    cursor: 'not-allowed',
  }
  const gap: React.CSSProperties = {
    ...btn,
    border: 'none',
    background: 'transparent',
    cursor: 'default',
    color: '#888',
  }

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: 'flex',
        gap: '6px',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        margin: '28px 0 8px',
      }}
    >
      {prev !== null ? (
        <Link href={buildHref(prev)} style={btn} aria-label="Página anterior">←</Link>
      ) : (
        <span style={disabled} aria-hidden>←</span>
      )}
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={'gap-' + i} style={gap}>…</span>
        ) : p === currentPage ? (
          <span key={p} style={active} aria-current="page">{p}</span>
        ) : (
          <Link key={p} href={buildHref(p)} style={btn}>{p}</Link>
        )
      )}
      {next !== null ? (
        <Link href={buildHref(next)} style={btn} aria-label="Página siguiente">→</Link>
      ) : (
        <span style={disabled} aria-hidden>→</span>
      )}
    </nav>
  )
}
