'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { buildWaMeUrl } from '@/lib/phone'

const CIUDADES_PRINCIPALES = [
  'Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Santo Domingo', 'Loja',
  'Machala', 'Riobamba', 'Esmeraldas', 'Ibarra', 'Latacunga', 'Portoviejo',
  'Tulcán', 'Babahoyo', 'Otra',
]

export type LeadModalContext = {
  listingId?: string | null
  listingTitle?: string | null
  listingUrl: string
  whatsappNumber: string
  listingOwnerType: 'dealer' | 'user'
  listingOwnerId: string
  dealerId?: string | null
}

export default function WhatsAppLeadModal({
  open, onClose, ctx, onSubmitted,
}: {
  open: boolean
  onClose: () => void
  ctx: LeadModalContext | null
  onSubmitted?: () => void
}) {
  const { status } = useSession()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState<string | undefined>('')
  const [ciudad, setCiudad] = useState('')
  const [financiamiento, setFinanciamiento] = useState<'si' | 'no' | ''>('')
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Cuando el modal pre-llena datos del perfil, forzamos remount del
  // PhoneInput con un key distinto. Sin esto, si el componente ya se
  // montó con value vacío, no re-evalúa el país al recibir un E.164
  // y el selector queda sin bandera, rompiendo la validación.
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Track apertura del modal
  useEffect(() => {
    if (open && ctx) {
      fetch('/api/leads/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead_modal_opened', listingId: ctx.listingId, dealerId: ctx.dealerId }),
      }).catch(() => {})
    }
  }, [open, ctx])

  // Pre-llenar el form con datos del perfil cuando el user está logueado.
  // Solo rellena campos vacíos: si el user ya tipeó algo, se respeta.
  // Si no está logueado, no hace nada (comportamiento original).
  useEffect(() => {
    if (!open) {
      setProfileLoaded(false)
      return
    }
    if (status !== 'authenticated') return
    let cancelled = false
    fetch('/api/user/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.user) return
        const u = d.user
        const fullName = [u.name, u.lastName].filter(Boolean).join(' ').trim()
        if (fullName) setNombre((prev) => prev || fullName)
        const normalizedPhone = normalizePhoneToE164EC(u.phone)
        if (normalizedPhone) setTelefono((prev) => prev || normalizedPhone)
        if (u.ciudad && CIUDADES_PRINCIPALES.includes(u.ciudad)) {
          setCiudad((prev) => prev || u.ciudad)
        }
        setProfileLoaded(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, status])

  // Bloquear scroll detras del modal
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open || !ctx) return null

  function valid(): boolean {
    if (nombre.trim().length < 2) return false
    if (!telefono || !isValidPhoneNumber(telefono)) return false
    if (!ciudad) return false
    return true
  }

  // El componente PhoneInput ya devuelve E.164 (+593987654321).
  function normalizedSubmitterPhone(): string {
    return telefono || ''
  }

  // CRITICO: Safari bloquea window.open si se llama tras un await porque
  // pierde el "user gesture context". Por eso construimos la URL primero,
  // abrimos WhatsApp en el mismo tick del click, y disparamos los fetch
  // en paralelo (sin await).
  function handleContinue() {
    setError(null)
    if (!valid() || !ctx) return

    const submitterPhone = normalizedSubmitterPhone()
    const ciudadStr = ciudad ? `, ${ciudad}` : ''
    const titulo = ctx.listingTitle ? `: ${ctx.listingTitle}` : ''
    const fin = financiamiento === 'si' ? ' Necesito financiamiento.' : ''
    const msg =
      `Hola, soy ${nombre.trim()} (${submitterPhone}${ciudadStr}). ` +
      `Me interesa esta moto${titulo}: ${ctx.listingUrl}. ¿Sigue disponible?${fin}`
    const waUrl = buildWaMeUrl(ctx.whatsappNumber, msg)

    // 1) Abrir WhatsApp INMEDIATO en el mismo tick del click — Safari friendly.
    // En desktop: pestaña nueva. En mobile: el deeplink wa.me abre la app
    // automaticamente sin perder la pestaña original.
    window.open(waUrl, '_blank', 'noopener,noreferrer')

    // 2) UI feedback: spinner + auto-close en 1s.
    setOpening(true)

    // 3) Persistir lead + tracking en paralelo (no bloquea apertura WhatsApp).
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre.trim(),
        telefono: submitterPhone,
        ciudad,
        interesadoFinanciamiento: financiamiento === 'si',
        listingId: ctx.listingId,
        listingOwnerType: ctx.listingOwnerType,
        listingOwnerId: ctx.listingOwnerId,
        dealerId: ctx.dealerId,
        tipo: 'whatsapp',
      }),
    }).then(async (res) => {
      const d = await res.json().catch(() => null)
      const leadId = d?.lead?.id
      // Tracking: form_submitted + redirected
      fetch('/api/leads/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead_form_submitted',
          listingId: ctx.listingId,
          dealerId: ctx.dealerId,
          leadId,
        }),
      }).catch(() => {})
      fetch('/api/leads/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whatsapp_redirected',
          listingId: ctx.listingId,
          dealerId: ctx.dealerId,
          leadId,
        }),
      }).catch(() => {})
    }).catch((e) => {
      // Si falla el guardado, lo logueamos pero no afectamos al user
      // (WhatsApp ya esta abierto).
      console.error('[lead persist failed]', e)
    })

    if (onSubmitted) onSubmitted()

    // Cerrar el modal automaticamente despues de 1s.
    setTimeout(() => {
      setOpening(false)
      onClose()
      // Reset del form para proxima apertura
      setNombre('')
      setTelefono('')
      setCiudad('')
      setFinanciamiento('')
    }, 1000)
  }

  const phoneError = !!telefono && !isValidPhoneNumber(telefono)

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => { if (!opening) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '8px', maxWidth: '440px', width: '100%',
          padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E2340' }}>
              Contactar por WhatsApp
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              Tus datos se comparten con el vendedor para que pueda responderte.
            </p>
          </div>
          <button onClick={onClose} disabled={opening} aria-label="Cerrar" style={{
            background: 'transparent', border: 'none', fontSize: '22px', cursor: opening ? 'not-allowed' : 'pointer',
            color: '#888', padding: '4px 8px', marginLeft: 8, opacity: opening ? 0.5 : 1,
          }}>×</button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Nombre completo *</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} disabled={opening} style={inp} placeholder="Tu nombre" />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Teléfono *</label>
          <PhoneInput
            key={profileLoaded ? 'prefilled' : 'empty'}
            international
            countryCallingCodeEditable={false}
            defaultCountry="EC"
            value={telefono}
            onChange={setTelefono}
            disabled={opening}
            className="mp-phone-input"
            placeholder="987654321"
          />
          {phoneError && (
            <div style={{ color: '#E8390E', fontSize: '11px', marginTop: 4 }}>
              Número inválido. Verifica el formato según el país.
            </div>
          )}
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Ciudad *</label>
          <select value={ciudad} onChange={e => setCiudad(e.target.value)} disabled={opening} style={inp}>
            <option value="">— Elegir —</option>
            {CIUDADES_PRINCIPALES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>¿Necesitas financiamiento?</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['si', 'no'] as const).map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: opening ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                <input type="radio" name="fin" value={v} disabled={opening} checked={financiamiento === v} onChange={() => setFinanciamiento(v)} />
                {v === 'si' ? 'Sí' : 'No'}
              </label>
            ))}
            {financiamiento && !opening && (
              <button type="button" onClick={() => setFinanciamiento('')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer' }}>
                limpiar
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#7F1D1D', padding: '8px 10px', borderRadius: 4, fontSize: 12, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!valid() || opening}
          style={{
            width: '100%',
            background: opening ? '#10B981' : (valid() ? '#25D366' : '#ccc'),
            color: '#fff', border: 'none', padding: '12px',
            borderRadius: '4px', fontSize: '14px', fontWeight: 800,
            cursor: !valid() || opening ? 'not-allowed' : 'pointer', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {opening && <Spinner />}
          {opening ? 'Abriendo WhatsApp…' : 'Continuar a WhatsApp'}
        </button>
        <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#888', lineHeight: 1.5, textAlign: 'center' }}>
          Al enviar este formulario aceptas que tus datos se compartan con el vendedor y con MotoPatío para fines de contacto.
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff',
      borderRadius: '50%', animation: 'mp-spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

/**
 * Normaliza un teléfono al formato E.164 con prefijo Ecuador.
 * - Si ya empieza con "+", se devuelve tal cual (cualquier país válido).
 * - Si no, se asume Ecuador: limpia caracteres no-dígitos y quita el cero
 *   inicial del formato local antes de prefijar +593.
 * Devuelve string vacío si no hay dígitos utilizables.
 */
function normalizePhoneToE164EC(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed
  const digits = trimmed.replace(/[^\d]/g, '').replace(/^0+/, '')
  return digits ? '+593' + digits : ''
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E2340',
  marginBottom: '4px', textTransform: 'uppercase',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '14px',
  border: '1px solid #d0d0d0', borderRadius: '4px', fontFamily: 'inherit',
}
