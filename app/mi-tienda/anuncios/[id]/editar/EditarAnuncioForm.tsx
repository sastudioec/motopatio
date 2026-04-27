'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MotoFormFields, { type MotoFormState } from '@/app/components/MotoFormFields'

const MAX_PHOTOS_DEALER = 15

// Whitelist editable: alineado con /api/mis-motos/[id] PATCH.
// Los demas campos quedan bloqueados con tooltip.
const LOCKED_FIELDS: ReadonlyArray<keyof MotoFormState> = [
  'marca', 'modelo', 'anio', 'cilindraje', 'tipo',
  'provincia', 'ciudad', 'color', 'placa', 'esElectrica',
]

type Initial = {
  marca: string
  modelo: string
  anio: number
  cilindraje: string
  tipo: string
  placa: string | null
  ciudad: string
  provincia: string | null
  precio: number
  km: number
  descripcion: string
  fotos: string[]
  color: string | null
  esElectrica: boolean
}

export default function EditarAnuncioForm({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter()
  const [form, setForm] = useState<MotoFormState>({
    marca: initial.marca,
    modelo: initial.modelo,
    anio: String(initial.anio),
    cilindraje: initial.cilindraje,
    cilindrajeOtro: '',
    tipo: initial.tipo,
    km: String(initial.km),
    precio: String(initial.precio),
    provincia: initial.provincia ?? '',
    ciudad: initial.ciudad,
    color: initial.color ?? '',
    descripcion: initial.descripcion,
    placa: initial.placa ?? '',
    esElectrica: initial.esElectrica,
  })
  const [fotos, setFotos] = useState<string[]>(initial.fotos)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [brands, setBrands] = useState<{ id: string; name: string; slug: string }[]>([])
  const [models, setModels] = useState<{ id: string; name: string; slug: string }[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)

  // Aunque los campos esten bloqueados, cargamos brands/models para que el
  // <select> deshabilitado muestre la marca actual (no "Cargando..." vacio).
  useEffect(() => {
    fetch('/api/catalog/brands').then(r => r.json()).then(d => {
      setBrands(d.brands || [])
      setBrandsLoading(false)
    }).catch(() => setBrandsLoading(false))
  }, [])
  useEffect(() => {
    if (!form.marca || form.marca === 'Otra') { setModels([]); return }
    const brand = brands.find(b => b.name === form.marca)
    if (!brand) return
    setModelsLoading(true)
    fetch('/api/catalog/models?brandId=' + brand.id).then(r => r.json()).then(d => {
      setModels(d.models || [])
      setModelsLoading(false)
    }).catch(() => setModelsLoading(false))
  }, [form.marca, brands])

  async function handleFoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files
    if (!files) return
    if (fotos.length + files.length > MAX_PHOTOS_DEALER) {
      alert('Máximo ' + MAX_PHOTOS_DEALER + ' fotos.')
      return
    }
    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('upload failed')
        const d = await res.json()
        if (d.url) setFotos(prev => [...prev, d.url])
      } catch (e) { console.error(e) }
    }
    setUploading(false)
    ev.target.value = ''
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    const precioNum = parseInt(form.precio)
    if (!form.precio || isNaN(precioNum) || precioNum < 100 || precioNum > 99999) e.precio = 'Precio entre $100 y $99.999'
    const kmNum = parseInt(form.km)
    if (form.km === '' || isNaN(kmNum) || kmNum < 0 || kmNum > 999999) e.km = 'Kilometraje entre 0 y 999.999'
    if (form.descripcion.length > 500) e.descripcion = 'Máximo 500 caracteres'
    if (fotos.length === 0) e.fotos = 'Sube al menos 1 foto'
    return e
  }

  async function handleSave() {
    setError(null)
    const eMap = validate()
    setErrors(eMap)
    if (Object.keys(eMap).length > 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/mis-motos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precio: parseInt(form.precio) || 0,
          km: parseInt(form.km) || 0,
          descripcion: form.descripcion,
          fotos,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'No se pudo guardar')
      router.push('/mi-tienda')
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Error inesperado')
      setSaving(false)
    }
  }

  return (
    <>
      <p style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, padding: 12, fontSize: 12, color: '#78350F', margin: '0 0 16px' }}>
        Solo se pueden editar precio, kilometraje, descripción y fotos. Marca, modelo, año, tipo y ubicación se fijan al publicar.
      </p>

      <MotoFormFields
        form={form}
        setForm={setForm}
        errors={errors}
        brands={brands}
        models={models}
        brandsLoading={brandsLoading}
        modelsLoading={modelsLoading}
        fotos={fotos}
        setFotos={setFotos}
        uploading={uploading}
        handleFoto={handleFoto}
        maxPhotos={MAX_PHOTOS_DEALER}
        lockedFields={LOCKED_FIELDS}
        lockedHelperText="No se puede modificar después de publicar."
        fotosHelpText={`Actualiza tus fotos (${fotos.length}/${MAX_PHOTOS_DEALER})`}
      />

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 8, padding: '14px 18px', marginBottom: 16, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 10 }}>
        <Link href="/mi-tienda" style={{ color: '#1E2340', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>← Cancelar</Link>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          style={{
            background: saving || uploading ? '#ccc' : '#E8390E',
            color: '#fff', border: 'none',
            padding: '12px 28px', fontSize: 13, fontWeight: 800,
            borderRadius: 4, cursor: saving || uploading ? 'wait' : 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}
