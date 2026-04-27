'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MotoFormFields, { INITIAL_MOTO_FORM, type MotoFormState } from '@/app/components/MotoFormFields'

const MAX_PHOTOS_DEALER = 15
const CURRENT_YEAR = new Date().getFullYear()

type Brand = { id: string; name: string; slug: string }
type Model = { id: string; name: string; slug: string }

export default function PublicarDealerClient({ dealerApproved }: { dealerApproved: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<MotoFormState>(INITIAL_MOTO_FORM)
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)

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

  // Misma validacion que PublicarClient (excepto lo de plan.maxPhotos).
  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!form.marca) e.marca = 'Selecciona una marca'
    if (!form.modelo.trim()) e.modelo = 'Selecciona un modelo'
    const anioNum = parseInt(form.anio)
    if (!form.anio || isNaN(anioNum) || anioNum < 1900 || anioNum > CURRENT_YEAR + 1) {
      e.anio = 'Año entre 1900 y ' + (CURRENT_YEAR + 1)
    }
    if (!form.cilindraje) e.cilindraje = form.esElectrica ? 'Selecciona potencia' : 'Selecciona cilindraje'
    if (form.cilindraje === 'Otro' && !form.cilindrajeOtro.trim()) {
      e.cilindraje = form.esElectrica ? 'Escribe la potencia' : 'Escribe el cilindraje'
    }
    if (!form.tipo) e.tipo = 'Selecciona tipo'
    const kmNum = parseInt(form.km)
    if (form.km === '' || isNaN(kmNum) || kmNum < 0 || kmNum > 999999) e.km = 'Kilometraje entre 0 y 999.999'
    const precioNum = parseInt(form.precio)
    if (!form.precio || isNaN(precioNum) || precioNum < 100 || precioNum > 99999) e.precio = 'Precio entre $100 y $99.999'
    if (!form.provincia) e.provincia = 'Selecciona provincia'
    if (!form.ciudad) e.ciudad = 'Selecciona ciudad'
    if (!form.color.trim()) e.color = 'Selecciona un color'
    if (!/^[A-Z]{2,3}-\d{3,4}$/.test(form.placa)) e.placa = 'Formato: ABC-1234 o AB-1234'
    if (form.descripcion.length > 500) e.descripcion = 'Máximo 500 caracteres'
    if (fotos.length === 0) e.fotos = 'Sube al menos 1 foto'
    if (fotos.length > MAX_PHOTOS_DEALER) e.fotos = `Máximo ${MAX_PHOTOS_DEALER} fotos por anuncio`
    return e
  }

  async function handleFoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files
    if (!files) return
    if (fotos.length + files.length > MAX_PHOTOS_DEALER) {
      alert('Máximo ' + MAX_PHOTOS_DEALER + ' fotos por anuncio.')
      return
    }
    const tooBig = Array.from(files).filter(f => f.size > 10 * 1024 * 1024).map(f => f.name)
    if (tooBig.length > 0) {
      alert('Estas fotos superan 10MB y no se subiran:\n' + tooBig.join(', '))
      ev.target.value = ''
      return
    }
    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        if (data.url) setFotos(prev => [...prev, data.url])
      } catch (e) {
        console.error('foto upload', e)
      }
    }
    setUploading(false)
    ev.target.value = ''
  }

  async function handleSubmit() {
    setPublishError(null)
    const eMap = validate()
    setErrors(eMap)
    if (Object.keys(eMap).length > 0) return
    setSubmitting(true)
    try {
      const cilindrajeFinal = form.cilindraje === 'Otro' ? form.cilindrajeOtro.trim() : form.cilindraje
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // El backend ignora durationDays/maxPhotos del plan cuando role=dealer.
          planId: 'gratis',
          marca: form.marca === 'Otra' ? form.modelo : form.marca,
          modelo: form.modelo,
          anio: parseInt(form.anio) || 0,
          cilindraje: cilindrajeFinal,
          tipo: form.tipo,
          km: parseInt(form.km) || 0,
          color: form.color || null,
          precio: parseInt(form.precio) || 0,
          provincia: form.provincia,
          ciudad: form.ciudad,
          placa: form.placa || null,
          descripcion: form.descripcion,
          esElectrica: form.esElectrica,
          fotos,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'No se pudo publicar')
      router.push('/mi-tienda')
      router.refresh()
    } catch (e: any) {
      setPublishError(e?.message || 'Error inesperado')
      setSubmitting(false)
    }
  }

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: '#1E2340' }}>Publicar moto</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
            {dealerApproved
              ? 'La moto se publica al instante en MotoPatío con el sello de tu concesionario.'
              : 'Tu cuenta está en revisión. La moto queda guardada y se publicará automáticamente cuando aprobemos tu concesionario.'}
          </p>
        </header>

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
          fotosHelpText={`Sube hasta ${MAX_PHOTOS_DEALER} fotos (${fotos.length}/${MAX_PHOTOS_DEALER})`}
        />

        {publishError && (
          <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 8, padding: '14px 18px', marginBottom: 16, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
            {publishError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 10, flexWrap: 'wrap' }}>
          <Link href="/mi-tienda" style={{ color: '#1E2340', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>← Cancelar</Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            style={{
              background: submitting || uploading ? '#ccc' : '#E8390E',
              color: '#fff', border: 'none',
              padding: '14px 28px', fontSize: 14, fontWeight: 800,
              borderRadius: 4, cursor: submitting || uploading ? 'wait' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {submitting ? 'Publicando…' : (dealerApproved ? 'Publicar' : 'Guardar (queda en revisión)')}
          </button>
        </div>
      </div>
    </main>
  )
}
