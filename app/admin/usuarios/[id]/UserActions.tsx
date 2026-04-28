'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

export default function UserActions({
  userId,
  role,
  blocked,
  dealerSlug,
}: {
  userId: string
  role: string
  blocked: boolean
  dealerSlug: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [localBlocked, setLocalBlocked] = useState(blocked)

  const isAdmin = role === 'admin'

  async function toggleBlock() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/usuarios/' + userId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !localBlocked }),
      })
      if (!res.ok) {
        alert('No se pudo actualizar el usuario.')
        return
      }
      setLocalBlocked(!localBlocked)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function deleteUser() {
    if (!confirm('¿Eliminar este usuario y todas sus motos? Esta acción es permanente.')) return
    if (!confirm('Confirma una vez más: el usuario y sus listings se borran definitivamente.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/usuarios/' + userId, { method: 'DELETE' })
      if (!res.ok) {
        alert('No se pudo eliminar el usuario.')
        setBusy(false)
        return
      }
      router.push('/admin?tab=usuarios')
    } catch {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {dealerSlug && (
        <Link
          href={`/dealers/${dealerSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={btnSecondary}
        >
          Ver perfil público ↗
        </Link>
      )}
      {!isAdmin ? (
        <>
          {localBlocked ? (
            <button onClick={toggleBlock} disabled={busy} style={btnSuccess}>
              {busy ? 'Procesando…' : 'Desbloquear'}
            </button>
          ) : (
            <button onClick={toggleBlock} disabled={busy} style={btnWarn}>
              {busy ? 'Procesando…' : 'Bloquear'}
            </button>
          )}
          <button onClick={deleteUser} disabled={busy} style={btnDanger}>
            {busy ? 'Procesando…' : 'Eliminar'}
          </button>
        </>
      ) : (
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, padding: '8px 4px' }}>
          Las acciones (bloquear/eliminar) están deshabilitadas para usuarios admin.
        </div>
      )}
    </div>
  )
}

const btnBase: React.CSSProperties = {
  border: 'none', borderRadius: 4,
  padding: '10px 14px', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
  textAlign: 'center', textDecoration: 'none',
}
const btnSuccess: React.CSSProperties = { ...btnBase, background: '#E1F5EE', color: '#0F6E56' }
const btnWarn: React.CSSProperties = { ...btnBase, background: '#FFF8E1', color: '#B45309' }
const btnDanger: React.CSSProperties = { ...btnBase, background: '#FCEBEB', color: '#A32D2D' }
const btnSecondary: React.CSSProperties = { ...btnBase, background: 'transparent', color: '#1E2340', border: '2px solid #1E2340' }
