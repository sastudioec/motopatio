'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { PROVINCIAS_ECUADOR } from '@/lib/provincias-ecuador'

type Step = 1 | 2

type FormState = {
  nombreComercial: string
  slug: string
  slugTouched: boolean
  descripcion: string
  provincia: string
  ciudad: string
  direccion: string
  googleMapsUrl: string
  telefono: string
  whatsapp: string
  emailContacto: string
  sitioWeb: string
  instagram: string
  facebook: string
  tiktok: string
  // Paso 2
  ruc: string
  razonSocial: string
  logo: string
  bannerImage: string
  documentoVerificacion: string
}

const initial: FormState = {
  nombreComercial: '',
  slug: '',
  slugTouched: false,
  descripcion: '',
  provincia: '',
  ciudad: '',
  direccion: '',
  googleMapsUrl: '',
  telefono: '',
  whatsapp: '',
  emailContacto: '',
  sitioWeb: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  ruc: '',
  razonSocial: '',
  logo: '',
  bannerImage: '',
  documentoVerificacion: '',
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  border: '1px solid #d0d0d0',
  borderRadius: '4px',
  fontFamily: 'inherit',
  background: '#fff',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#1E2340',
  marginBottom: '4px',
  textTransform: 'uppercase',
}
const fieldStyle: React.CSSProperties = { marginBottom: '14px' }
const helpStyle: React.CSSProperties = { fontSize: '11px', color: '#888', marginTop: '4px' }
const errorStyle: React.CSSProperties = { color: '#E8390E', fontSize: '12px', marginTop: '6px' }

export default function DealerOnboardingWizard() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(initial)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ slug: string } | null>(null)
  const slugCheckTimeout = useRef<any>(null)

  // Slug auto-generado desde nombreComercial mientras el usuario no lo toque
  useEffect(() => {
    if (!form.slugTouched) {
      const auto = slugify(form.nombreComercial)
      if (auto !== form.slug) {
        setForm((f) => ({ ...f, slug: auto }))
      }
    }
  }, [form.nombreComercial, form.slugTouched, form.slug])

  // Validacion live de slug (debounced 400ms)
  useEffect(() => {
    if (!form.slug) { setSlugStatus('idle'); return }
    if (form.slug.length < 3 || !/^[a-z0-9-]+$/.test(form.slug)) {
      setSlugStatus('invalid'); return
    }
    setSlugStatus('checking')
    if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current)
    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/dealers/check-slug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: form.slug }),
        })
        const d = await res.json()
        if (d.available) setSlugStatus('available')
        else setSlugStatus(d.reason === 'invalid' ? 'invalid' : 'taken')
      } catch { setSlugStatus('idle') }
    }, 400)
    return () => slugCheckTimeout.current && clearTimeout(slugCheckTimeout.current)
  }, [form.slug])

  const provincia = PROVINCIAS_ECUADOR.find((p) => p.nombre === form.provincia)

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function step1Valid(): boolean {
    return Boolean(
      form.nombreComercial.trim() &&
      form.slug && slugStatus === 'available' &&
      form.descripcion.trim() && form.descripcion.length <= 1000 &&
      form.provincia && form.ciudad &&
      form.direccion.trim() &&
      form.googleMapsUrl.trim() &&
      form.telefono.trim() &&
      form.whatsapp.trim() &&
      form.emailContacto.trim()
      // sitioWeb, instagram, facebook, tiktok son opcionales
    )
  }
  function step2Valid(): boolean {
    return Boolean(
      /^\d{13}$/.test(form.ruc.trim()) &&
      form.razonSocial.trim() &&
      form.logo &&
      form.bannerImage &&
      form.documentoVerificacion
    )
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const d = await res.json().catch(() => null)
      throw new Error(d?.error || 'No se pudo subir el archivo')
    }
    const d = await res.json()
    return d.url
  }

  async function handleSubmit() {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const redes: Record<string, string> = {}
      if (form.instagram.trim()) redes.instagram = form.instagram.trim()
      if (form.facebook.trim()) redes.facebook = form.facebook.trim()
      if (form.tiktok.trim()) redes.tiktok = form.tiktok.trim()
      const res = await fetch('/api/dealers/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreComercial: form.nombreComercial.trim(),
          slug: form.slug,
          descripcion: form.descripcion.trim(),
          ciudad: form.ciudad,
          provincia: form.provincia,
          direccion: form.direccion.trim() || null,
          googleMapsUrl: form.googleMapsUrl.trim() || null,
          telefono: form.telefono.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          emailContacto: form.emailContacto.trim() || null,
          sitioWeb: form.sitioWeb.trim() || null,
          redes: Object.keys(redes).length ? redes : null,
          ruc: form.ruc.trim(),
          razonSocial: form.razonSocial.trim(),
          logo: form.logo,
          bannerImage: form.bannerImage || null,
          documentoVerificacion: form.documentoVerificacion,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        throw new Error(d?.error || 'No se pudo registrar el concesionario')
      }
      setSuccess({ slug: d.dealer.slug })
    } catch (e: any) {
      setSubmitError(e?.message || 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
        <h2 style={{ fontSize: '24px', color: '#1E2340', marginBottom: '12px' }}>
          Registro recibido
        </h2>
        <p style={{ color: '#444', fontSize: '15px', lineHeight: 1.6, marginBottom: '12px' }}>
          Tu cuenta está <strong>en revisión</strong>. Te avisaremos por email cuando aprobemos tu concesionario (usualmente en menos de 24 horas hábiles).
        </p>
        <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Mientras tanto puedes acceder a tu panel y empezar a cargar motos —se publicarán automáticamente cuando aprobemos tu cuenta.
        </p>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
          Para acceder al panel "Mi Tienda" necesitamos que cierres sesión y vuelvas a entrar.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: `/auth/login?next=/mi-tienda` })}
          style={{
            background: '#E8390E', color: '#fff', border: 'none',
            padding: '14px 32px', fontSize: '14px', fontWeight: 800,
            borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
          Cerrar sesión y entrar al panel
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <StepDot n={1} active={step === 1} done={step > 1} label="Datos comerciales" />
        <StepDot n={2} active={step === 2} done={false} label="Documentación" />
      </div>

      {step === 1 && (
        <div style={{ background: '#fff', padding: 'clamp(16px, 4vw, 32px)', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '20px', color: '#1E2340', marginBottom: '4px' }}>Paso 1 — Datos comerciales</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            Información que verán los compradores en tu perfil público.
          </p>

          <div style={fieldStyle}>
            <label style={labelStyle}>Nombre comercial *</label>
            <input style={inputStyle} value={form.nombreComercial}
              onChange={(e) => update('nombreComercial', e.target.value)}
              placeholder="Motos del Patio S.A." />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>URL pública (slug) *</label>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <span style={{
                background: '#f4f4f5', padding: '10px 12px', fontSize: '13px',
                color: '#666', border: '1px solid #d0d0d0', borderRight: 0,
                borderRadius: '4px 0 0 4px', whiteSpace: 'nowrap',
              }}>motopatio.com/dealers/</span>
              <input
                style={{ ...inputStyle, borderRadius: '0 4px 4px 0' }}
                value={form.slug}
                onChange={(e) => {
                  update('slug', slugify(e.target.value))
                  update('slugTouched', true)
                }}
                placeholder="motos-del-patio"
              />
            </div>
            <div style={helpStyle}>
              {slugStatus === 'checking' && 'Verificando…'}
              {slugStatus === 'available' && <span style={{ color: '#16a34a' }}>✓ Disponible</span>}
              {slugStatus === 'taken' && <span style={{ color: '#E8390E' }}>✗ Ya está en uso</span>}
              {slugStatus === 'invalid' && <span style={{ color: '#E8390E' }}>Mínimo 3 letras, solo a-z 0-9 y guiones</span>}
              {slugStatus === 'idle' && 'Solo letras minúsculas, números y guiones'}
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Descripción * ({form.descripcion.length}/1000)</label>
            <textarea
              style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
              maxLength={1000}
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Concesionario familiar con 15 años de experiencia en motos urbanas y de aventura..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Provincia *</label>
              <select
                style={inputStyle}
                value={form.provincia}
                onChange={(e) => { update('provincia', e.target.value); update('ciudad', '') }}>
                <option value="">— Elegir —</option>
                {PROVINCIAS_ECUADOR.map((p) => (
                  <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Ciudad *</label>
              <select style={inputStyle} disabled={!provincia}
                value={form.ciudad}
                onChange={(e) => update('ciudad', e.target.value)}>
                <option value="">— Elegir —</option>
                {provincia?.ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Dirección *</label>
            <input style={inputStyle} value={form.direccion}
              onChange={(e) => update('direccion', e.target.value)}
              placeholder="Av. 6 de Diciembre N24-253 y Lizardo García" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>URL de Google Maps *</label>
            <input style={inputStyle} value={form.googleMapsUrl}
              onChange={(e) => update('googleMapsUrl', e.target.value)}
              placeholder="https://maps.google.com/..." />
            <div style={helpStyle}>Compartir → Insertar mapa o pega el link público.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Teléfono *</label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="EC"
                value={form.telefono || undefined}
                onChange={(v) => update('telefono', v || '')}
                className="mp-phone-input"
                placeholder="022345678"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>WhatsApp *</label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="EC"
                value={form.whatsapp || undefined}
                onChange={(v) => update('whatsapp', v || '')}
                className="mp-phone-input"
                placeholder="987654321"
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email público *</label>
            <input style={inputStyle} type="email" value={form.emailContacto}
              onChange={(e) => update('emailContacto', e.target.value)}
              placeholder="ventas@motosdelpatio.com" />
            <div style={helpStyle}>Distinto al email de tu cuenta. Se mostrará en tu perfil.</div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Sitio web</label>
            <input style={inputStyle} value={form.sitioWeb}
              onChange={(e) => update('sitioWeb', e.target.value)}
              placeholder="https://motosdelpatio.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Instagram</label>
              <input style={inputStyle} value={form.instagram}
                onChange={(e) => update('instagram', e.target.value)}
                placeholder="@motosdelpatio" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Facebook</label>
              <input style={inputStyle} value={form.facebook}
                onChange={(e) => update('facebook', e.target.value)}
                placeholder="motosdelpatio" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>TikTok</label>
              <input style={inputStyle} value={form.tiktok}
                onChange={(e) => update('tiktok', e.target.value)}
                placeholder="@motosdelpatio" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid()}
              style={{
                background: step1Valid() ? '#E8390E' : '#ccc',
                color: '#fff', border: 'none',
                padding: '12px 28px', fontSize: '13px', fontWeight: 800,
                borderRadius: '4px', cursor: step1Valid() ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
              }}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: '#fff', padding: 'clamp(16px, 4vw, 32px)', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '20px', color: '#1E2340', marginBottom: '4px' }}>Paso 2 — Documentación</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            Datos legales y verificación. Solo el equipo de MotoPatio los ve.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>RUC * (13 dígitos)</label>
              <input style={inputStyle} value={form.ruc}
                onChange={(e) => update('ruc', e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="1790012345001" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Razón social *</label>
              <input style={inputStyle} value={form.razonSocial}
                onChange={(e) => update('razonSocial', e.target.value)}
                placeholder="Motos del Patio S.A." />
            </div>
          </div>

          <UploadField
            label="Logo *"
            help="PNG o JPG, idealmente cuadrado (recomendado 400×400)."
            value={form.logo}
            onChange={(v) => update('logo', v)}
            uploadFile={uploadFile}
          />
          <UploadField
            label="Banner *"
            help="PNG o JPG horizontal (recomendado 1600×400)."
            value={form.bannerImage}
            onChange={(v) => update('bannerImage', v)}
            uploadFile={uploadFile}
          />
          <UploadField
            label="Documento de verificación *"
            help="Sube tu RUC, certificado de matrícula del concesionario o equivalente."
            value={form.documentoVerificacion}
            onChange={(v) => update('documentoVerificacion', v)}
            uploadFile={uploadFile}
          />

          {submitError && <div style={errorStyle}>⚠ {submitError}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button
              onClick={() => setStep(1)}
              disabled={submitting}
              style={{
                background: 'transparent', color: '#1E2340',
                border: '2px solid #1E2340',
                padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase',
              }}>
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={!step2Valid() || submitting}
              style={{
                background: step2Valid() && !submitting ? '#E8390E' : '#ccc',
                color: '#fff', border: 'none',
                padding: '12px 28px', fontSize: '13px', fontWeight: 800,
                borderRadius: '4px',
                cursor: step2Valid() && !submitting ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
              }}>
              {submitting ? 'Enviando…' : 'Finalizar registro'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  const bg = done ? '#16a34a' : active ? '#E8390E' : '#ccc'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: bg, color: '#fff', fontWeight: 800, fontSize: '13px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{done ? '✓' : n}</div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: active ? '#1E2340' : '#888' }}>{label}</span>
    </div>
  )
}

function UploadField({
  label, help, value, onChange, uploadFile,
}: {
  label: string
  help: string
  value: string
  onChange: (v: string) => void
  uploadFile: (f: File) => Promise<string>
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {value ? (
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '4px', overflow: 'hidden', border: '1px solid #e0e0e0',
          }}>
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setError(null)
            setUploading(true)
            try {
              const url = await uploadFile(f)
              onChange(url)
            } catch (err: any) {
              setError(err?.message || 'Error subiendo archivo')
            } finally {
              setUploading(false)
              if (inputRef.current) inputRef.current.value = ''
            }
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            background: '#fff', color: '#1E2340',
            border: '1px solid #1E2340',
            padding: '8px 16px', fontSize: '12px', fontWeight: 700,
            borderRadius: '4px', cursor: uploading ? 'wait' : 'pointer',
            textTransform: 'uppercase',
          }}>
          {uploading ? 'Subiendo…' : value ? 'Cambiar' : 'Subir archivo'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              background: 'transparent', color: '#E8390E',
              border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
            }}>
            Quitar
          </button>
        )}
      </div>
      <div style={helpStyle}>{help}</div>
      {error && <div style={errorStyle}>⚠ {error}</div>}
    </div>
  )
}
