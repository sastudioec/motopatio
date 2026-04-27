'use client'

import { ReactNode } from 'react'
import { getProvincias, getCiudadesByProvincia } from '@/lib/provincias-ecuador'

export type MotoFormState = {
  marca: string
  modelo: string
  anio: string
  cilindraje: string
  cilindrajeOtro: string
  tipo: string
  km: string
  precio: string
  provincia: string
  ciudad: string
  color: string
  descripcion: string
  placa: string
  esElectrica: boolean
}

export const INITIAL_MOTO_FORM: MotoFormState = {
  marca: '', modelo: '', anio: '', cilindraje: '', cilindrajeOtro: '', tipo: '',
  km: '', precio: '', provincia: '', ciudad: '', color: '', descripcion: '', placa: '',
  esElectrica: false,
}

const TIPOS = ['Urbana', 'Naked', 'Trail/Enduro', 'Scooter', 'Deportiva', 'Crucero', 'Touring', 'Doble propósito']
const CILINDRADAS = ['50cc', '100cc', '110cc', '125cc', '150cc', '160cc', '200cc', '250cc', '300cc', '400cc', '500cc', '600cc', '650cc', '700cc+', 'Otro']
const POTENCIAS_ELECTRICAS = ['Menos de 1 kW', '1-3 kW', '3-5 kW', '5-10 kW', '10-20 kW', 'Más de 20 kW', 'Otro']
const COLORES = ['Amarillo', 'Azul', 'Bicolor', 'Blanco', 'Cafe', 'Dorado', 'Gris', 'Morado', 'Naranja', 'Negro', 'Plateado', 'Rojo', 'Rosa', 'Verde', 'Otro']

const onlyDigits = (v: string, max: number) => {
  const d = v.replace(/\D/g, '')
  if (!d) return ''
  return String(Math.min(parseInt(d), max))
}

const formatPlaca = (v: string) => {
  const clean = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const m = clean.match(/^([A-Z]{0,3})(\d{0,4})/)
  if (!m) return ''
  const letras = m[1]
  const nums = m[2]
  if (letras.length === 0) return ''
  if (nums.length === 0) return letras
  return letras + '-' + nums
}

const inputStyle = (hasError: boolean, locked?: boolean): React.CSSProperties => ({
  width: '100%', height: '44px', padding: '0 12px',
  border: hasError ? '1px solid #dc2626' : '1px solid #e0e0e0',
  borderRadius: '4px', fontSize: '14px',
  background: locked ? '#f5f5f5' : '#fff',
  color: locked ? '#999' : '#000',
  cursor: locked ? 'not-allowed' : 'text',
  boxSizing: 'border-box', fontFamily: 'inherit',
})
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '6px' }
const errorStyle: React.CSSProperties = { fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 500 }

type MotoFormFieldsProps = {
  form: MotoFormState
  setForm: (next: MotoFormState) => void
  errors: Record<string, string>
  brands: { id: string; name: string; slug: string }[]
  models: { id: string; name: string; slug: string }[]
  brandsLoading: boolean
  modelsLoading: boolean
  fotos: string[]
  setFotos: (next: string[]) => void
  uploading: boolean
  handleFoto: (ev: React.ChangeEvent<HTMLInputElement>) => void
  maxPhotos: number
  // Campos no editables (post-publicación). Default vacío = todo editable.
  lockedFields?: ReadonlyArray<keyof MotoFormState>
  // Texto chico debajo del input bloqueado.
  lockedHelperText?: string
  // Texto del bloque "Sube hasta X fotos con plan Y" — opcional.
  fotosHelpText?: string
  // Si true, el bloque de fotos NO muestra el contador de plan.
  hideFotosHelpText?: boolean
}

export default function MotoFormFields({
  form, setForm, errors,
  brands, models, brandsLoading, modelsLoading,
  fotos, setFotos, uploading, handleFoto, maxPhotos,
  lockedFields = [], lockedHelperText, fotosHelpText, hideFotosHelpText,
}: MotoFormFieldsProps) {
  const isLocked = (k: keyof MotoFormState) => lockedFields.includes(k)
  const lockedHelper = lockedHelperText ? (
    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
      {lockedHelperText}
    </div>
  ) : null
  const helperFor = (k: keyof MotoFormState) => (isLocked(k) ? lockedHelper : null)

  return (
    <>
      <div style={{ background: '#fff', borderRadius: '8px', padding: 'clamp(16px, 4vw, 28px)', border: '1px solid #e8e8e8', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E2340', textTransform: 'uppercase', marginBottom: '20px' }}>Datos de la moto</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.marca}>
            <label style={labelStyle}>Marca *</label>
            <select
              value={form.marca}
              onChange={(e) => {
                const marca = e.target.value
                if (marca === 'Otra') {
                  setForm({ ...form, marca, modelo: 'Otra' })
                } else {
                  setForm({ ...form, marca, modelo: '' })
                }
              }}
              disabled={brandsLoading || isLocked('marca')}
              style={inputStyle(!!errors.marca, isLocked('marca'))}
            >
              <option value="">{brandsLoading ? 'Cargando marcas...' : 'Selecciona'}</option>
              {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value="Otra">Otra</option>
            </select>
            {errors.marca && <div style={errorStyle}>{errors.marca}</div>}
            {helperFor('marca')}
          </div>
          {form.marca && form.marca !== 'Otra' && (
            <div data-error={!!errors.modelo}>
              <label style={labelStyle}>Modelo *</label>
              <select
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                disabled={modelsLoading || models.length === 0 || isLocked('modelo')}
                style={inputStyle(!!errors.modelo, isLocked('modelo'))}
              >
                <option value="">{modelsLoading ? 'Cargando modelos...' : 'Selecciona modelo'}</option>
                {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value="Otro">Otro</option>
              </select>
              {errors.modelo && <div style={errorStyle}>{errors.modelo}</div>}
              {helperFor('modelo')}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.anio}>
            <label style={labelStyle}>Año *</label>
            <input
              type="text" inputMode="numeric" value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              disabled={isLocked('anio')}
              style={inputStyle(!!errors.anio, isLocked('anio'))}
              placeholder={String(new Date().getFullYear())}
            />
            {errors.anio && <div style={errorStyle}>{errors.anio}</div>}
            {helperFor('anio')}
          </div>
          <div data-error={!!errors.cilindraje}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{form.esElectrica ? 'Potencia' : 'Cilindraje'} *</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#555', cursor: isLocked('esElectrica') ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.esElectrica}
                  onChange={(e) => setForm({ ...form, esElectrica: e.target.checked, cilindraje: '', cilindrajeOtro: '' })}
                  disabled={isLocked('esElectrica')}
                  style={{ margin: 0, cursor: isLocked('esElectrica') ? 'not-allowed' : 'pointer' }}
                />
                ⚡ Eléctrica
              </label>
            </div>
            <select
              value={form.cilindraje}
              onChange={(e) => setForm({ ...form, cilindraje: e.target.value, cilindrajeOtro: e.target.value === 'Otro' ? form.cilindrajeOtro : '' })}
              disabled={isLocked('cilindraje')}
              style={inputStyle(!!errors.cilindraje, isLocked('cilindraje'))}
            >
              <option value="">Selecciona</option>
              {(form.esElectrica ? POTENCIAS_ELECTRICAS : CILINDRADAS).map((c) => <option key={c}>{c}</option>)}
            </select>
            {form.cilindraje === 'Otro' && (
              <input
                type="text"
                value={form.cilindrajeOtro}
                onChange={(e) => setForm({ ...form, cilindrajeOtro: e.target.value.slice(0, 20) })}
                placeholder={form.esElectrica ? 'Ej: 7 kW' : 'Ej: 180cc'}
                maxLength={20}
                disabled={isLocked('cilindraje')}
                style={{ ...inputStyle(!!errors.cilindraje, isLocked('cilindraje')), marginTop: '6px' }}
              />
            )}
            {errors.cilindraje && <div style={errorStyle}>{errors.cilindraje}</div>}
            {helperFor('cilindraje')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.tipo}>
            <label style={labelStyle}>Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              disabled={isLocked('tipo')}
              style={inputStyle(!!errors.tipo, isLocked('tipo'))}>
              <option value="">Selecciona</option>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
            {errors.tipo && <div style={errorStyle}>{errors.tipo}</div>}
            {helperFor('tipo')}
          </div>
          <div data-error={!!errors.km}>
            <label style={labelStyle}>Kilometraje *</label>
            <input type="text" inputMode="numeric" value={form.km}
              onChange={(e) => setForm({ ...form, km: onlyDigits(e.target.value, 999999) })}
              disabled={isLocked('km')}
              style={inputStyle(!!errors.km, isLocked('km'))} placeholder="15000" />
            {errors.km && <div style={errorStyle}>{errors.km}</div>}
            {helperFor('km')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.precio}>
            <label style={labelStyle}>Precio ($) *</label>
            <input type="text" inputMode="numeric" value={form.precio}
              onChange={(e) => setForm({ ...form, precio: onlyDigits(e.target.value, 99999) })}
              disabled={isLocked('precio')}
              style={inputStyle(!!errors.precio, isLocked('precio'))} placeholder="3500" />
            {errors.precio && <div style={errorStyle}>{errors.precio}</div>}
            {helperFor('precio')}
          </div>
          <div data-error={!!errors.provincia}>
            <label style={labelStyle}>Provincia *</label>
            <select
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value, ciudad: '' })}
              disabled={isLocked('provincia')}
              style={inputStyle(!!errors.provincia, isLocked('provincia'))}
            >
              <option value="">Selecciona</option>
              {getProvincias().map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.provincia && <div style={errorStyle}>{errors.provincia}</div>}
            {helperFor('provincia')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.ciudad}>
            <label style={labelStyle}>Ciudad *</label>
            <select
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              disabled={!form.provincia || isLocked('ciudad')}
              style={inputStyle(!!errors.ciudad, isLocked('ciudad'))}
            >
              <option value="">{form.provincia ? 'Selecciona ciudad' : 'Selecciona provincia primero'}</option>
              {form.provincia && getCiudadesByProvincia(form.provincia).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.ciudad && <div style={errorStyle}>{errors.ciudad}</div>}
            {helperFor('ciudad')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px', marginBottom: '16px' }}>
          <div data-error={!!errors.color}>
            <label style={labelStyle}>Color *</label>
            <select
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              disabled={isLocked('color')}
              style={inputStyle(!!errors.color, isLocked('color'))}
            >
              <option value="">Selecciona</option>
              {COLORES.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            {errors.color && <div style={errorStyle}>{errors.color}</div>}
            {helperFor('color')}
          </div>
          <div data-error={!!errors.placa}>
            <label style={labelStyle}>Placa * <span style={{ fontWeight: 400, color: '#888' }}>(Ecuador)</span></label>
            <input value={form.placa} onChange={(e) => setForm({ ...form, placa: formatPlaca(e.target.value) })}
              disabled={isLocked('placa')}
              style={{ ...inputStyle(!!errors.placa, isLocked('placa')), textTransform: 'uppercase', letterSpacing: '1px' }}
              placeholder="ABC-1234" maxLength={8} />
            {errors.placa && <div style={errorStyle}>{errors.placa}</div>}
            {helperFor('placa')}
          </div>
        </div>

        <div data-error={!!errors.descripcion}>
          <label style={labelStyle}>
            Descripción <span style={{ fontWeight: 400, color: '#888' }}>({form.descripcion.length}/500)</span>
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value.slice(0, 500) })}
            rows={4}
            disabled={isLocked('descripcion')}
            style={{ ...inputStyle(!!errors.descripcion, isLocked('descripcion')), height: 'auto', padding: '10px 12px', resize: 'vertical' }}
            placeholder="Describe el estado, accesorios, historial de mantenimiento..."
          />
          {errors.descripcion && <div style={errorStyle}>{errors.descripcion}</div>}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: 'clamp(16px, 4vw, 28px)', border: errors.fotos ? '1px solid #dc2626' : '1px solid #e8e8e8', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E2340', textTransform: 'uppercase', marginBottom: '20px' }}>Fotos *</div>
        <div style={{ border: '2px dashed #e0e0e0', borderRadius: '8px', padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
          {!hideFotosHelpText && (
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              {fotosHelpText || `Sube hasta ${maxPhotos} fotos (${fotos.length}/${maxPhotos})`}
            </div>
          )}
          <label style={{ background: '#E8390E', color: 'white', padding: '10px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>
            {uploading ? 'Subiendo...' : 'Seleccionar fotos'}
            <input
              type="file" multiple accept="image/*"
              onChange={handleFoto}
              style={{ display: 'none' }}
              disabled={uploading || fotos.length >= maxPhotos}
            />
          </label>
        </div>
        {errors.fotos && <div style={errorStyle}>{errors.fotos}</div>}
        {fotos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginTop: '12px' }}>
            {fotos.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                <button
                  type="button"
                  onClick={() => setFotos(fotos.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                >x</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
