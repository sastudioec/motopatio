'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { PROVINCIAS_ECUADOR } from '@/lib/provincias-ecuador'

type Initial = {
  nombreComercial: string
  descripcion: string
  logo: string
  bannerImage: string
  direccion: string
  ciudad: string
  provincia: string
  googleMapsUrl: string
  telefono: string
  whatsapp: string
  emailContacto: string
  sitioWeb: string
  redes: Record<string, string> | null
  ruc: string
  razonSocial: string
  slug: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '14px',
  border: '1px solid #d0d0d0', borderRadius: '4px',
  fontFamily: 'inherit', background: '#fff',
}
const disabledStyle: React.CSSProperties = {
  ...inputStyle, background: '#f4f4f5', color: '#888', cursor: 'not-allowed',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E2340',
  marginBottom: '4px', textTransform: 'uppercase',
}
const fieldStyle: React.CSSProperties = { marginBottom: '14px' }
const helpStyle: React.CSSProperties = { fontSize: '11px', color: '#888', marginTop: '4px' }

export default function MiTiendaPerfilForm({ initial }: { initial: Initial }) {
  const [form, setForm] = useState({
    ...initial,
    instagram: initial.redes?.instagram || '',
    facebook: initial.redes?.facebook || '',
    tiktok: initial.redes?.tiktok || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const provincia = PROVINCIAS_ECUADOR.find((p) => p.nombre === form.provincia)

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
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

  async function handleSave() {
    setMsg(null)
    setSaving(true)
    try {
      const redes: Record<string, string> = {}
      if (form.instagram.trim()) redes.instagram = form.instagram.trim()
      if (form.facebook.trim()) redes.facebook = form.facebook.trim()
      if (form.tiktok.trim()) redes.tiktok = form.tiktok.trim()
      const res = await fetch('/api/dealers/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreComercial: form.nombreComercial,
          descripcion: form.descripcion,
          logo: form.logo,
          bannerImage: form.bannerImage,
          direccion: form.direccion,
          ciudad: form.ciudad,
          provincia: form.provincia,
          googleMapsUrl: form.googleMapsUrl,
          telefono: form.telefono,
          whatsapp: form.whatsapp,
          emailContacto: form.emailContacto,
          sitioWeb: form.sitioWeb,
          redes: Object.keys(redes).length ? redes : null,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'No se pudo guardar')
      setMsg({ kind: 'ok', text: 'Cambios guardados.' })
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Error inesperado' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      padding: 'clamp(16px, 4vw, 32px)',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
    }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Nombre comercial</label>
        <input style={inputStyle} value={form.nombreComercial}
          onChange={(e) => update('nombreComercial', e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Descripción ({form.descripcion.length}/1000)</label>
        <textarea
          style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
          maxLength={1000}
          value={form.descripcion}
          onChange={(e) => update('descripcion', e.target.value)} />
      </div>

      <UploadField label="Logo" value={form.logo} onChange={(v) => update('logo', v)} uploadFile={uploadFile} />
      <UploadField label="Banner" value={form.bannerImage} onChange={(v) => update('bannerImage', v)} uploadFile={uploadFile} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Provincia</label>
          <select style={inputStyle} value={form.provincia}
            onChange={(e) => { update('provincia', e.target.value); update('ciudad', '') }}>
            <option value="">— Elegir —</option>
            {PROVINCIAS_ECUADOR.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Ciudad</label>
          <select style={inputStyle} disabled={!provincia} value={form.ciudad}
            onChange={(e) => update('ciudad', e.target.value)}>
            <option value="">— Elegir —</option>
            {provincia?.ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Dirección</label>
        <input style={inputStyle} value={form.direccion} onChange={(e) => update('direccion', e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Google Maps URL</label>
        <input style={inputStyle} value={form.googleMapsUrl} onChange={(e) => update('googleMapsUrl', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Teléfono</label>
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry="EC"
            value={form.telefono || undefined}
            onChange={(v) => update('telefono', v || '')}
            className="mp-phone-input"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>WhatsApp</label>
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry="EC"
            value={form.whatsapp || undefined}
            onChange={(v) => update('whatsapp', v || '')}
            className="mp-phone-input"
          />
        </div>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Email público</label>
        <input style={inputStyle} type="email" value={form.emailContacto} onChange={(e) => update('emailContacto', e.target.value)} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Sitio web</label>
        <input style={inputStyle} value={form.sitioWeb} onChange={(e) => update('sitioWeb', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Instagram</label>
          <input style={inputStyle} value={form.instagram} onChange={(e) => update('instagram', e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Facebook</label>
          <input style={inputStyle} value={form.facebook} onChange={(e) => update('facebook', e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>TikTok</label>
          <input style={inputStyle} value={form.tiktok} onChange={(e) => update('tiktok', e.target.value)} />
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid #ececec', margin: '20px 0' }} />

      <h3 style={{ fontSize: '14px', color: '#1E2340', margin: '0 0 12px' }}>Datos legales (no editables)</h3>
      <p style={helpStyle}>Para cambiar RUC o razón social hay que hacer una nueva verificación. Escribinos a info@motopatio.com.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>RUC</label>
          <input style={disabledStyle} disabled value={form.ruc} title="Para cambiarlo, contactanos." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Razón social</label>
          <input style={disabledStyle} disabled value={form.razonSocial} title="Para cambiarlo, contactanos." />
        </div>
      </div>

      {msg && (
        <div style={{
          marginTop: '16px', padding: '10px 14px', borderRadius: '4px',
          background: msg.kind === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.kind === 'ok' ? '#166534' : '#991b1b',
          fontSize: '13px', fontWeight: 700,
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <Link href="/mi-tienda" style={{
          color: '#1E2340', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
          padding: '12px 0',
        }}>← Volver al panel</Link>
        <button onClick={handleSave} disabled={saving}
          style={{
            background: saving ? '#ccc' : '#E8390E', color: '#fff', border: 'none',
            padding: '12px 28px', fontSize: '13px', fontWeight: 800,
            borderRadius: '4px', cursor: saving ? 'wait' : 'pointer',
            textTransform: 'uppercase',
          }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

function UploadField({
  label, value, onChange, uploadFile,
}: {
  label: string; value: string; onChange: (v: string) => void; uploadFile: (f: File) => Promise<string>
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {value && (
          <div style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setUploading(true)
            try {
              const url = await uploadFile(f)
              onChange(url)
            } finally {
              setUploading(false)
              if (inputRef.current) inputRef.current.value = ''
            }
          }} />
        <button type="button" disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            background: '#fff', color: '#1E2340', border: '1px solid #1E2340',
            padding: '8px 16px', fontSize: '12px', fontWeight: 700,
            borderRadius: '4px', cursor: uploading ? 'wait' : 'pointer', textTransform: 'uppercase',
          }}>
          {uploading ? 'Subiendo…' : value ? 'Cambiar' : 'Subir archivo'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            style={{
              background: 'transparent', color: '#E8390E',
              border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
            }}>Quitar</button>
        )}
      </div>
    </div>
  )
}
