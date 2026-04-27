'use client'

import { ReactNode } from 'react'

/**
 * Select con estilo consistente del sitio: appearance:none + flecha SVG
 * inline. Reusable en /motos, /dealers y donde haga falta sustituir un
 * <select> nativo. NO maneja state — pasalo como controlled component.
 */
export default function StyledSelect({
  value, onChange, disabled, children, ariaLabel, minWidth = 160,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: ReactNode
  ariaLabel?: string
  minWidth?: number | string
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', minWidth }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          padding: '9px 36px 9px 12px',
          fontSize: '13px',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          color: disabled ? '#999' : '#1E2340',
          background: disabled ? '#f4f4f5' : '#fff',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: disabled ? '#bbb' : '#1E2340',
          fontSize: 10,
          lineHeight: 1,
        }}
      >
        ▼
      </span>
    </div>
  )
}
