'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PROVINCIAS_ECUADOR, getProvincias, getCiudadesByProvincia } from '@/lib/provincias-ecuador'
import { getPlanCopy, getPlanCtaLabel } from '@/lib/plan-copy'

type PlanCatalog = {
  id: string
  name: string
  priceCents: number
  durationDays: number
  maxPhotos: number
  featuredDays: number
  cooldownDays: number
  description: string | null
  sortOrder: number
}

type CajitaConfig = {
  token: string
  storeId: string
  clientTransactionId: string
  amount: number
  amountWithoutTax: number
  amountWithTax: number
  tax: number
  service: number
  tip: number
  currency: string
  reference: string
  lang: string
  defaultMethod: string
  cssUrl: string
  jsUrl: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { PPaymentButtonBox?: any } }

function PublicarContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const retryPaymentId = searchParams.get('retry')
  const draftListingId = searchParams.get('draft')
  const editListingId = searchParams.get('edit')
  const isEditMode = !!editListingId
  const [retryNotice, setRetryNotice] = useState<string | null>(null)
  const [retryLoading, setRetryLoading] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<{type:'ok'|'err',text:string}|null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [errors, setErrors] = useState<Record<string,string>>({})

  // --- Planes ---
  const [plans, setPlans] = useState<PlanCatalog[]>([])
  const [brands, setBrands] = useState<{id:string,name:string,slug:string}[]>([])
  const [models, setModels] = useState<{id:string,name:string,slug:string}[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalog | null>(null)
  const [plansLoading, setPlansLoading] = useState(true)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [cajitaLoading, setCajitaLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [hasFreeActive, setHasFreeActive] = useState(false)
  const [freeCooldownDays, setFreeCooldownDays] = useState(0)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => {
        setPlans(d.plans || [])
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [])

  // Cargar marcas del catalogo
  useEffect(() => {
    fetch('/api/catalog/brands')
      .then(r => r.json())
      .then(d => {
        setBrands(d.brands || [])
        setBrandsLoading(false)
      })
      .catch(() => setBrandsLoading(false))
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/auth/check-verified', { credentials: 'include' })
        .then(r => r.json())
        .then(d => setEmailVerified(d.verified))
        .catch(() => setEmailVerified(true))
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.email) return
    fetch('/api/listings/free-active', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { hasFreeActive: false, daysRemaining: 0 })
      .then(d => {
        setHasFreeActive(!!d.hasFreeActive)
        setFreeCooldownDays(typeof d.daysRemaining === 'number' ? d.daysRemaining : 0)
      })
      .catch(() => { setHasFreeActive(false); setFreeCooldownDays(0) })
  }, [session])

  // Cargar draft guardado si venimos de un reintento (?retry=paymentId)
  useEffect(() => {
    if (!retryPaymentId) return
    if (status !== 'authenticated') return
    let cancelled = false
    setRetryLoading(true)
    fetch('/api/pagos/' + retryPaymentId + '/draft', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (!d?.ok || !d?.draft) { setRetryLoading(false); return }
        const dr = d.draft
        setForm({
          marca: String(dr.marca || ''),
          modelo: String(dr.modelo || ''),
          anio: String(dr.anio || ''),
          cilindraje: String(dr.cilindraje || ''),
          cilindrajeOtro: '',
          tipo: String(dr.tipo || ''),
          km: String(dr.km || ''),
          precio: String(dr.precio || ''),
          provincia: String(dr.provincia || ''),
          ciudad: String(dr.ciudad || ''),
          color: String(dr.color || ''),
          descripcion: String(dr.descripcion || ''),
          placa: String(dr.placa || ''),
          esElectrica: Boolean(dr.esElectrica),
        })
        if (Array.isArray(dr.fotos)) {
          setFotos(dr.fotos.filter((f: unknown) => typeof f === 'string'))
        }
        // Pre-seleccionar el plan anterior para saltar directo al formulario
        if (d.planId) {
          const prevPlan = plans.find(p => p.id === d.planId)
          if (prevPlan) setSelectedPlan(prevPlan)
        }
        setRetryLoading(false)
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/publicar')
        }
      })
      .catch(() => { if (!cancelled) setRetryLoading(false) })
    return () => { cancelled = true }
  }, [retryPaymentId, status, plans])

  // Cargar borrador si venimos de /mis-motos con ?draft=listingId
  useEffect(() => {
    if (!draftListingId) return
    if (status !== 'authenticated') return
    let cancelled = false
    setRetryLoading(true)
    fetch('/api/listings/draft/' + draftListingId, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (!d?.ok || !d?.draft) { setRetryLoading(false); return }
        const dr = d.draft
        setForm({
          marca: String(dr.marca || ''),
          modelo: String(dr.modelo || ''),
          anio: String(dr.anio || ''),
          cilindraje: String(dr.cilindraje || ''),
          cilindrajeOtro: '',
          tipo: String(dr.tipo || ''),
          km: String(dr.km || ''),
          precio: String(dr.precio || ''),
          provincia: String(dr.provincia || ''),
          ciudad: String(dr.ciudad || ''),
          color: String(dr.color || ''),
          descripcion: String(dr.descripcion || ''),
          placa: String(dr.placa || ''),
          esElectrica: Boolean(dr.esElectrica),
        })
        if (Array.isArray(dr.fotos)) {
          setFotos(dr.fotos.filter((f: unknown) => typeof f === 'string'))
        }
        if (d.planId) {
          const prevPlan = plans.find(p => p.id === d.planId)
          if (prevPlan) setSelectedPlan(prevPlan)
        }
        setRetryLoading(false)
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/publicar')
        }
      })
      .catch(() => { if (!cancelled) setRetryLoading(false) })
    return () => { cancelled = true }
  }, [draftListingId, status, plans])

  // Cargar moto existente si venimos de /mis-motos con ?edit=listingId
  useEffect(() => {
    if (!editListingId) return
    if (status !== 'authenticated') return
    let cancelled = false
    setRetryLoading(true)
    fetch('/api/mis-motos/' + editListingId, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (!d?.listing) { setRetryLoading(false); return }
        const m = d.listing
        let fotosArr: string[] = []
        try { fotosArr = JSON.parse(m.fotos || '[]') } catch {}
        setForm({
          marca: String(m.marca || ''),
          modelo: String(m.modelo || ''),
          anio: String(m.anio || ''),
          cilindraje: String(m.cilindraje || ''),
          cilindrajeOtro: '',
          tipo: String(m.tipo || ''),
          km: String(m.km || ''),
          precio: String(m.precio || ''),
          provincia: String(m.provincia || ''),
          ciudad: String(m.ciudad || ''),
          color: String(m.color || ''),
          descripcion: String(m.descripcion || ''),
          placa: String(m.placa || ''),
          esElectrica: Boolean(m.esElectrica),
        })
        setFotos(fotosArr.filter((f: unknown) => typeof f === 'string'))
        setRetryLoading(false)
      })
      .catch(() => { if (!cancelled) setRetryLoading(false) })
    return () => { cancelled = true }
  }, [editListingId, status])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const [form, setForm] = useState({
    marca: '', modelo: '', anio: '', cilindraje: '', cilindrajeOtro: '', tipo: '',
    km: '', precio: '', provincia: '', ciudad: '', color: '', descripcion: '', placa: '',
    esElectrica: false
  })

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (!form.marca || form.marca === 'Otra') {
      setModels([])
      return
    }
    const brand = brands.find(b => b.name === form.marca)
    if (!brand) return
    setModelsLoading(true)
    fetch('/api/catalog/models?brandId=' + brand.id)
      .then(r => r.json())
      .then(d => {
        setModels(d.models || [])
        setModelsLoading(false)
      })
      .catch(() => setModelsLoading(false))
  }, [form.marca, brands])

  const tipos = ['Urbana','Naked','Trail/Enduro','Scooter','Deportiva','Crucero','Touring','Doble propósito']
  const cilindradas = ['50cc','100cc','110cc','125cc','150cc','160cc','200cc','250cc','300cc','400cc','500cc','600cc','650cc','700cc+','Otro']
  const potenciasElectricas = ['Menos de 1 kW','1-3 kW','3-5 kW','5-10 kW','10-20 kW','Más de 20 kW','Otro']
  const colores = ['Amarillo','Azul','Bicolor','Blanco','Cafe','Dorado','Gris','Morado','Naranja','Negro','Plateado','Rojo','Rosa','Verde','Otro']

  const CURRENT_YEAR = new Date().getFullYear()

  const onlyLettersSpaces = (v:string) => v.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g,'').slice(0,20)
  const modeloSanitize = (v:string) => v.replace(/[^A-Za-z0-9\s.\-]/g,'').slice(0,40)
  const onlyDigits = (v:string, max:number) => {
    const d = v.replace(/\D/g,'')
    if (!d) return ''
    return String(Math.min(parseInt(d), max))
  }

  const formatPlaca = (v:string) => {
    const clean = v.replace(/[^A-Za-z0-9]/g,'').toUpperCase()
    const m = clean.match(/^([A-Z]{0,3})(\d{0,4})/)
    if (!m) return ''
    const letras = m[1]
    const nums = m[2]
    if (letras.length === 0) return ''
    if (nums.length === 0) return letras
    return letras + '-' + nums
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.marca) e.marca = 'Selecciona una marca'
    if (!form.modelo.trim()) e.modelo = 'Selecciona un modelo'
    const anioNum = parseInt(form.anio)
    if (!form.anio || isNaN(anioNum) || anioNum < 1900 || anioNum > CURRENT_YEAR + 1) {
      e.anio = 'Año entre 1900 y ' + (CURRENT_YEAR + 1)
    }
    if (!form.cilindraje) e.cilindraje = form.esElectrica ? 'Selecciona potencia' : 'Selecciona cilindraje'
    if (form.cilindraje === 'Otro' && !form.cilindrajeOtro.trim()) e.cilindraje = form.esElectrica ? 'Escribe la potencia' : 'Escribe el cilindraje'
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
    if (selectedPlan && fotos.length > selectedPlan.maxPhotos) {
      e.fotos = 'Tu plan permite máximo ' + selectedPlan.maxPhotos + ' fotos'
    }
    return e
  }

  const handleFoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files
    if (!files) return
    const maxFotos = selectedPlan ? selectedPlan.maxPhotos : 8
    if (fotos.length + files.length > maxFotos) {
      alert('Maximo ' + maxFotos + ' fotos con el plan ' + (selectedPlan?.name || ''))
      return
    }
    const tooBig = Array.from(files).filter(f => f.size > 10 * 1024 * 1024).map(f => f.name)
    if (tooBig.length > 0) {
      alert('Estas fotos superan los 10MB y no se subiran. Reduce su tamano e intenta de nuevo:\n' + tooBig.join(', '))
      ev.target.value = ''
      return
    }
    setUploading(true)
    let ok = 0, fail = 0
    const fallidas: string[] = []
    for (const file of Array.from(files)) {
      let success = false
      for (let intento = 1; intento <= 3 && !success; intento++) {
        try {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const data = await res.json()
          if (!data.url) throw new Error('Sin URL')
          setFotos(prev => [...prev, data.url])
          success = true
          ok++
        } catch (err) {
          console.error('Intento ' + intento + ' fallo para ' + file.name, err)
          if (intento < 3) await new Promise(r => setTimeout(r, 1000 * intento))
        }
      }
      if (!success) { fail++; fallidas.push(file.name) }
      await new Promise(r => setTimeout(r, 1500))
    }
    setUploading(false)
    if (fail > 0) {
      alert('Subieron ' + ok + ' de ' + (ok+fail) + ' fotos.\nFallaron: ' + fallidas.join(', '))
    }
    ev.target.value = ''
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg(null)
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'include' })
      const d = await r.json()
      if (r.ok) {
        setResendMsg({type:'ok', text: d.message || 'Email reenviado. Revisa tu correo.'})
        setCooldown(60)
      } else {
        setResendMsg({type:'err', text: d.error || 'Error al reenviar'})
        if (d.cooldown) setCooldown(d.cooldown)
      }
    } catch {
      setResendMsg({type:'err', text: 'Error de conexión'})
    }
    setResending(false)
  }

  // Carga dinamica del CSS/JS de la Cajita (idempotente)
  const loadCajitaAssets = (cssUrl: string, jsUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // CSS
      if (!document.querySelector('link[data-payphone="css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cssUrl
        link.dataset.payphone = 'css'
        document.head.appendChild(link)
      }
      // JS
      if (window.PPaymentButtonBox) {
        resolve()
        return
      }
      let script = document.querySelector('script[data-payphone="js"]') as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.type = 'module'
        script.src = jsUrl
        script.dataset.payphone = 'js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('No se pudo cargar el script de PayPhone'))
        document.head.appendChild(script)
      } else {
        script.addEventListener('load', () => resolve())
        script.addEventListener('error', () => reject(new Error('No se pudo cargar el script de PayPhone')))
      }
    })
  }

  const openCajita = async (cfg: CajitaConfig) => {
    await loadCajitaAssets(cfg.cssUrl, cfg.jsUrl)
    // Esperar hasta 3 segundos a que PPaymentButtonBox este disponible
    const start = Date.now()
    while (!window.PPaymentButtonBox && Date.now() - start < 3000) {
      await new Promise(r => setTimeout(r, 100))
    }
    if (!window.PPaymentButtonBox) {
      throw new Error('PayPhone no se cargó. Intenta recargar la página.')
    }
    // Asegurar contenedor
    let container = document.getElementById('pp-button')
    if (!container) {
      container = document.createElement('div')
      container.id = 'pp-button'
      document.body.appendChild(container)
    }
    const ppb = new window.PPaymentButtonBox({
      token: cfg.token,
      clientTransactionId: cfg.clientTransactionId,
      amount: cfg.amount,
      amountWithoutTax: cfg.amountWithoutTax,
      amountWithTax: cfg.amountWithTax,
      tax: cfg.tax,
      service: cfg.service,
      tip: cfg.tip,
      currency: cfg.currency,
      storeId: cfg.storeId,
      reference: cfg.reference,
      lang: cfg.lang,
      defaultMethod: cfg.defaultMethod,
    })
    ppb.render('pp-button')
  }

  const handleSaveDraft = async () => {
    setPublishError(null)
    // Validacion minima: marca, modelo y ciudad
    const missing: string[] = []
    if (!form.marca.trim()) missing.push('marca')
    if (!form.modelo.trim()) missing.push('modelo')
    if (!form.provincia.trim()) missing.push('provincia')
    if (!form.ciudad.trim()) missing.push('ciudad')
    if (missing.length > 0) {
      setPublishError('Para guardar como borrador necesitamos al menos: ' + missing.join(', ') + '.')
      const firstErr = document.querySelector('[data-error="true"]')
      if (firstErr) firstErr.scrollIntoView({behavior:'smooth', block:'center'})
      return
    }
    setSavingDraft(true)
    try {
      const res = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          ...form,
          cilindraje: form.cilindraje === 'Otro' ? form.cilindrajeOtro : form.cilindraje,
          esElectrica: form.esElectrica,
          fotos,
          planId: selectedPlan?.id,
          draftId: draftListingId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPublishError(data.error || 'No se pudo guardar el borrador')
        setSavingDraft(false)
        return
      }
      router.push('/mis-motos?saved=1')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar borrador'
      setPublishError(msg)
      setSavingDraft(false)
    }
  }

    const handleSubmit = async () => {
    // MODO EDICION: solo actualizar campos permitidos
    if (isEditMode && editListingId) {
      setPublishError(null)
      setLoading(true)
      try {
        const res = await fetch('/api/mis-motos/' + editListingId, {
          method: 'PATCH',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            precio: parseInt(form.precio) || 0,
            km: parseInt(form.km) || 0,
            descripcion: form.descripcion,
            fotos,
          }),
        })
        if (res.ok) {
          router.push('/mis-motos')
          return
        }
        const data = await res.json()
        setPublishError(data.error || 'Error al guardar cambios')
      } catch {
        setPublishError('Error de conexion')
      }
      setLoading(false)
      return
    }

    if (!selectedPlan) return
    setPublishError(null)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      const firstErr = document.querySelector('[data-error="true"]')
      if (firstErr) firstErr.scrollIntoView({behavior:'smooth', block:'center'})
      return
    }

    // Plan pagado: iniciar transaccion PayPhone
    if (selectedPlan.priceCents > 0) {
      setCajitaLoading(true)
      try {
        const res = await fetch('/api/pagos/iniciar', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            planId: selectedPlan.id,
            listingDraft: {
              ...form,
              cilindraje: form.cilindraje === 'Otro' ? form.cilindrajeOtro : form.cilindraje,
              esElectrica: form.esElectrica,
              fotos,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setPublishError(data.error || 'No se pudo iniciar el pago')
          setCajitaLoading(false)
          return
        }
        await openCajita(data.cajita)
        // La Cajita se abre sola. El setCajitaLoading(false) se deja en true
        // porque el usuario va a completar el pago; al final PayPhone redirige
        // a /api/pagos/confirmar y luego a /pago/resultado.
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al abrir pasarela'
        setPublishError(msg)
        setCajitaLoading(false)
      }
      return
    }

    // Plan gratis: flujo existente
    setLoading(true)
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        ...form,
        cilindraje: form.cilindraje === 'Otro' ? form.cilindrajeOtro : form.cilindraje,
        esElectrica: form.esElectrica,
        fotos,
        planId: selectedPlan.id,
      }),
    })
    if (res.ok) {
      router.push('/mis-motos')
      return
    }
    setLoading(false)
    try {
      const data = await res.json()
      if (res.status === 429 && data.daysRemaining) {
        setPublishError('Ya usaste tu anuncio gratis. Podrás publicar gratis de nuevo en ' + data.daysRemaining + ' día(s), o elige Básico o Full para publicar ahora.')
      } else if (data.error) {
        setPublishError(data.error + (data.message ? ': ' + data.message : ''))
      } else {
        setPublishError('Error al publicar. Intenta nuevamente.')
      }
    } catch {
      setPublishError('Error al publicar. Intenta nuevamente.')
    }
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const inputStyle = (hasError:boolean, locked?:boolean):React.CSSProperties => ({
    width:'100%', height:'44px', padding:'0 12px',
    border: hasError ? '1px solid #dc2626' : '1px solid #e0e0e0',
    borderRadius:'4px', fontSize:'14px',
    background: locked ? '#f5f5f5' : '#fff',
    color: locked ? '#999' : '#000',
    cursor: locked ? 'not-allowed' : 'text',
    boxSizing:'border-box', fontFamily:'inherit'
  })
  const labelStyle:React.CSSProperties = {fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}
  const errorStyle:React.CSSProperties = {fontSize:'11px',color:'#dc2626',marginTop:'4px',fontWeight:500}
  const lockedHelper = isEditMode ? (
    <div style={{fontSize:'11px',color:'#888',marginTop:'4px',fontStyle:'italic'}}>
      No se puede modificar después de publicar. Contacta soporte si necesitas cambiarlo.
    </div>
  ) : null

  const blocked = emailVerified === false
  const isLoadingVerif = emailVerified === null

  const renderPlanSelector = () => {
    if (plansLoading) {
      return <div style={{textAlign:'center',padding:'40px',color:'#888'}}>Cargando planes...</div>
    }
    return (
      <div style={{background:'#fff',borderRadius:'8px',padding:'28px',border:'1px solid #e8e8e8',marginBottom:'20px'}}>
        <div style={{fontSize:'14px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'8px'}}>Elige tu plan</div>
        <div style={{fontSize:'13px',color:'#666',marginBottom:'20px'}}>Escoge cómo quieres publicar tu moto. Todos los planes son pagos únicos, sin suscripciones.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'14px'}}>
          {plans.map(plan => {
            const copy = getPlanCopy(plan)
            const isPopular = !!copy.badge
            const isGratis = plan.id === 'gratis'
            const freeActiveBlock = isGratis && hasFreeActive
            const freeCooldownBlock = isGratis && !hasFreeActive && freeCooldownDays > 0
            const freeBlocked = freeActiveBlock || freeCooldownBlock
            const planDisabled = blocked || isLoadingVerif || freeBlocked
            return (
              <div key={plan.id}
                style={{
                  border: isPopular ? '2px solid #E8390E' : '1px solid #e0e0e0',
                  borderRadius:'8px', padding:'20px', position:'relative',
                  background: isPopular ? '#fff8f5' : '#fff',
                  display:'flex', flexDirection:'column',
                  opacity: freeBlocked ? 0.55 : 1,
                }}>
                {copy.badge && (
                  <div style={{position:'absolute',top:'-10px',right:'16px',background:'#E8390E',color:'#fff',fontSize:'10px',fontWeight:800,padding:'4px 10px',borderRadius:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                    {copy.badge}
                  </div>
                )}
                <div style={{fontSize:'16px',fontWeight:900,color:'#1E2340',fontFamily:'Poppins,sans-serif',marginBottom:'4px'}}>
                  {plan.name}
                </div>
                <div style={{fontSize:'28px',fontWeight:900,color:'#E8390E',fontFamily:'Poppins,sans-serif',marginBottom:'12px'}}>
                  ${(plan.priceCents / 100).toFixed(0)}
                  <span style={{fontSize:'12px',fontWeight:500,color:'#888',marginLeft:'4px'}}>USD</span>
                </div>
                <ul style={{listStyle:'none',padding:0,margin:'0 0 16px 0',fontSize:'13px',color:'#444',lineHeight:1.8,flex:1}}>
                  {copy.features.map(f => (
                    f.highlight ? (
                      <li key={f.text} style={{background:'#fff4e6',borderRadius:'4px',padding:'6px 10px',margin:'4px 0',fontWeight:700,color:'#E8390E'}}>
                        {f.text}
                      </li>
                    ) : (
                      <li key={f.text}>✓ {f.text}</li>
                    )
                  ))}
                  {copy.noFeatures.map(f => (
                    <li key={f} style={{color:'#aaa'}}>✗ {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  disabled={planDisabled}
                  style={{
                    width:'100%', padding:'11px',
                    background: isPopular ? '#E8390E' : '#1E2340',
                    color:'#fff', border:'none', borderRadius:'4px',
                    fontSize:'13px', fontWeight:800,
                    cursor: planDisabled ? 'not-allowed' : 'pointer',
                    textTransform:'uppercase',
                    opacity: planDisabled ? 0.5 : 1,
                  }}>
                  {getPlanCtaLabel(plan)}
                </button>
                {freeActiveBlock && (
                  <div style={{fontSize:'11px',color:'#666',marginTop:'8px',lineHeight:1.4}}>
                    Ya tienes un anuncio gratuito activo. Espera a que expire, o elige Básico o Full.
                  </div>
                )}
                {freeCooldownBlock && (
                  <div style={{fontSize:'11px',color:'#666',marginTop:'8px',lineHeight:1.4}}>
                    Ya usaste tu anuncio gratis. Podrás publicar gratis de nuevo en {freeCooldownDays} día{freeCooldownDays === 1 ? '' : 's'}, o elige Básico/Full para publicar ahora.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSelectedPlanBar = () => {
    if (!selectedPlan) return null
    return (
      <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:'8px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:'11px',color:'#888',fontWeight:600,textTransform:'uppercase',marginBottom:'2px'}}>Plan seleccionado</div>
          <div style={{fontSize:'16px',fontWeight:800,color:'#1E2340',fontFamily:'Poppins,sans-serif'}}>
            {selectedPlan.name} · ${(selectedPlan.priceCents / 100).toFixed(0)} · {selectedPlan.durationDays} días · {selectedPlan.maxPhotos} fotos
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedPlan(null); setPublishError(null) }}
          style={{background:'transparent',color:'#E8390E',border:'1px solid #E8390E',padding:'8px 14px',borderRadius:'4px',fontSize:'12px',fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>
          Cambiar plan
        </button>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{maxWidth:'720px',margin:'24px auto',padding:'0 20px'}}>
        <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'24px',fontWeight:900,color:'#1E2340',marginBottom:'8px'}}>{isEditMode ? 'Editar publicación' : 'Publicar mi moto'}</h1>
        <p style={{fontSize:'13px',color:'#888',marginBottom:'20px'}}>{isEditMode ? 'Puedes actualizar precio, descripción, kilometraje y fotos. La marca, modelo, año y placa no se pueden cambiar.' : 'Completa la información para publicar tu moto'}</p>

        {blocked && (
          <div style={{background:'#fef3c7',border:'2px solid #f59e0b',borderRadius:'8px',padding:'20px',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'14px'}}>
              <div style={{fontSize:'32px',lineHeight:1}}>⚠️</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'16px',fontWeight:800,color:'#92400e',marginBottom:'6px'}}>Debes verificar tu correo para publicar</div>
                <div style={{fontSize:'13px',color:'#78350f',marginBottom:'14px',lineHeight:1.5}}>
                  Enviamos un correo de verificación a <strong>{session?.user?.email}</strong>.
                  Revisa tu bandeja de entrada (y la carpeta de spam). ¿No lo recibiste o lo borraste? Reenvíalo aquí.
                </div>
                <button onClick={handleResend} disabled={resending || cooldown > 0}
                  style={{background: cooldown > 0 ? '#d4a373' : '#E8390E',color:'white',border:'none',padding:'10px 20px',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor: (resending || cooldown > 0) ? 'not-allowed' : 'pointer',textTransform:'uppercase'}}>
                  {resending ? 'Enviando...' : cooldown > 0 ? 'Reintentar en ' + cooldown + 's' : 'Reenviar email de verificación'}
                </button>
                {resendMsg && (
                  <div style={{marginTop:'10px',fontSize:'13px',fontWeight:600,color: resendMsg.type === 'ok' ? '#16a34a' : '#dc2626'}}>
                    {resendMsg.type === 'ok' ? '✓ ' : '✗ '}{resendMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(retryPaymentId || draftListingId) && retryLoading && !selectedPlan && (
          <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:'12px',padding:'60px 20px',textAlign:'center',color:'#888',fontSize:'14px',fontFamily:'Montserrat,sans-serif'}}>
            Recuperando los datos de tu moto...
          </div>
        )}
        {!isEditMode && !selectedPlan && !((retryPaymentId || draftListingId) && retryLoading) && renderPlanSelector()}
        {!isEditMode && selectedPlan && renderSelectedPlanBar()}

        {(isEditMode || selectedPlan) && (
          <fieldset disabled={blocked || isLoadingVerif} style={{border:'none',padding:0,margin:0, opacity: blocked ? 0.55 : 1, pointerEvents: blocked ? 'none' : 'auto'}}>
            <div style={{background:'#fff',borderRadius:'8px',padding:'28px',border:'1px solid #e8e8e8',marginBottom:'16px'}}>
              <div style={{fontSize:'14px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'20px'}}>Datos de la moto</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.marca}>
                  <label style={labelStyle}>Marca *</label>
                  <select
                    value={form.marca}
                    onChange={e=>{
                      const marca = e.target.value
                      // Si eligio "Otra", automaticamente modelo = "Otra" y no aparece el select
                      if (marca === 'Otra') {
                        setForm({...form, marca, modelo: 'Otra'})
                      } else {
                        setForm({...form, marca, modelo: ''})
                      }
                    }}
                    disabled={brandsLoading || isEditMode}
                    style={inputStyle(!!errors.marca, isEditMode)}
                  >
                    <option value="">{brandsLoading ? 'Cargando marcas...' : 'Selecciona'}</option>
                    {brands.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  {errors.marca && <div style={errorStyle}>{errors.marca}</div>}
                  {lockedHelper}
                </div>
                {form.marca && form.marca !== 'Otra' && (
                  <div data-error={!!errors.modelo}>
                    <label style={labelStyle}>Modelo *</label>
                    <select
                      value={form.modelo}
                      onChange={e=>setForm({...form, modelo: e.target.value})}
                      disabled={modelsLoading || models.length === 0 || isEditMode}
                      style={inputStyle(!!errors.modelo, isEditMode)}
                    >
                      <option value="">{modelsLoading ? 'Cargando modelos...' : 'Selecciona modelo'}</option>
                      {models.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                    {errors.modelo && <div style={errorStyle}>{errors.modelo}</div>}
                    {lockedHelper}
                  </div>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.anio}>
                  <label style={labelStyle}>Año *</label>
                  <input type="text" inputMode="numeric" value={form.anio}
                    onChange={e=>setForm({...form,anio:e.target.value.replace(/\D/g,'').slice(0,4)})}
                    disabled={isEditMode}
                    style={inputStyle(!!errors.anio, isEditMode)} placeholder={String(CURRENT_YEAR)} />
                  {errors.anio && <div style={errorStyle}>{errors.anio}</div>}
                  {lockedHelper}
                </div>
                <div data-error={!!errors.cilindraje}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                    <label style={{...labelStyle, marginBottom:0}}>{form.esElectrica ? 'Potencia' : 'Cilindraje'} *</label>
                    <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'#555',cursor:'pointer',userSelect:'none'}}>
                      <input
                        type="checkbox"
                        checked={form.esElectrica}
                        onChange={e=>setForm({...form, esElectrica: e.target.checked, cilindraje: '', cilindrajeOtro: ''})}
                        disabled={isEditMode}
                        style={{margin:0, cursor: isEditMode ? 'not-allowed' : 'pointer'}}
                      />
                      ⚡ Eléctrica
                    </label>
                  </div>
                  <select value={form.cilindraje} onChange={e=>setForm({...form,cilindraje:e.target.value, cilindrajeOtro: e.target.value === 'Otro' ? form.cilindrajeOtro : ''})}
                    disabled={isEditMode}
                    style={inputStyle(!!errors.cilindraje, isEditMode)}>
                    <option value="">Selecciona</option>
                    {(form.esElectrica ? potenciasElectricas : cilindradas).map(c=><option key={c}>{c}</option>)}
                  </select>
                  {form.cilindraje === 'Otro' && (
                    <input
                      type="text"
                      value={form.cilindrajeOtro}
                      onChange={e=>setForm({...form, cilindrajeOtro: e.target.value.slice(0,20)})}
                      placeholder={form.esElectrica ? 'Ej: 7 kW' : 'Ej: 180cc'}
                      maxLength={20}
                      disabled={isEditMode}
                      style={{...inputStyle(!!errors.cilindraje, isEditMode), marginTop:'6px'}}
                    />
                  )}
                  {errors.cilindraje && <div style={errorStyle}>{errors.cilindraje}</div>}
                  {lockedHelper}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.tipo}>
                  <label style={labelStyle}>Tipo *</label>
                  <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}
                    disabled={isEditMode}
                    style={inputStyle(!!errors.tipo, isEditMode)}>
                    <option value="">Selecciona</option>
                    {tipos.map(t=><option key={t}>{t}</option>)}
                  </select>
                  {errors.tipo && <div style={errorStyle}>{errors.tipo}</div>}
                  {lockedHelper}
                </div>
                <div data-error={!!errors.km}>
                  <label style={labelStyle}>Kilometraje *</label>
                  <input type="text" inputMode="numeric" value={form.km}
                    onChange={e=>setForm({...form,km:onlyDigits(e.target.value,999999)})}
                    style={inputStyle(!!errors.km)} placeholder="15000" />
                  {errors.km && <div style={errorStyle}>{errors.km}</div>}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.precio}>
                  <label style={labelStyle}>Precio ($) *</label>
                  <input type="text" inputMode="numeric" value={form.precio}
                    onChange={e=>setForm({...form,precio:onlyDigits(e.target.value,99999)})}
                    style={inputStyle(!!errors.precio)} placeholder="3500" />
                  {errors.precio && <div style={errorStyle}>{errors.precio}</div>}
                </div>
                <div data-error={!!errors.provincia}>
                  <label style={labelStyle}>Provincia *</label>
                  <select
                    value={form.provincia}
                    onChange={e=>setForm({...form, provincia: e.target.value, ciudad: ''})}
                    disabled={isEditMode}
                    style={inputStyle(!!errors.provincia, isEditMode)}
                  >
                    <option value="">Selecciona</option>
                    {getProvincias().map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.provincia && <div style={errorStyle}>{errors.provincia}</div>}
                  {lockedHelper}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.ciudad}>
                  <label style={labelStyle}>Ciudad *</label>
                  <select
                    value={form.ciudad}
                    onChange={e=>setForm({...form, ciudad: e.target.value})}
                    disabled={!form.provincia || isEditMode}
                    style={inputStyle(!!errors.ciudad, isEditMode)}
                  >
                    <option value="">{form.provincia ? 'Selecciona ciudad' : 'Selecciona provincia primero'}</option>
                    {form.provincia && getCiudadesByProvincia(form.provincia).map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.ciudad && <div style={errorStyle}>{errors.ciudad}</div>}
                  {lockedHelper}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px',marginBottom:'16px'}}>
                <div data-error={!!errors.color}>
                  <label style={labelStyle}>Color *</label>
                  <select
                    value={form.color}
                    onChange={e=>setForm({...form, color: e.target.value})}
                    disabled={isEditMode}
                    style={inputStyle(!!errors.color, isEditMode)}
                  >
                    <option value="">Selecciona</option>
                    {colores.map(col=><option key={col} value={col}>{col}</option>)}
                  </select>
                  {errors.color && <div style={errorStyle}>{errors.color}</div>}
                  {lockedHelper}
                </div>
                <div data-error={!!errors.placa}>
                  <label style={labelStyle}>Placa * <span style={{fontWeight:400,color:'#888'}}>(Ecuador)</span></label>
                  <input value={form.placa} onChange={e=>setForm({...form,placa:formatPlaca(e.target.value)})}
                    disabled={isEditMode}
                    style={{...inputStyle(!!errors.placa, isEditMode), textTransform:'uppercase', letterSpacing:'1px'}}
                    placeholder="ABC-1234" maxLength={8} />
                  {errors.placa && <div style={errorStyle}>{errors.placa}</div>}
                  {lockedHelper}
                </div>
              </div>
              <div data-error={!!errors.descripcion}>
                <label style={labelStyle}>
                  Descripción <span style={{fontWeight:400,color:'#888'}}>({form.descripcion.length}/500)</span>
                </label>
                <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value.slice(0,500)})} rows={4}
                  style={{...inputStyle(!!errors.descripcion), height:'auto', padding:'10px 12px', resize:'vertical'}}
                  placeholder="Describe el estado, accesorios, historial de mantenimiento..." />
                {errors.descripcion && <div style={errorStyle}>{errors.descripcion}</div>}
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:'8px',padding:'28px',border: errors.fotos ? '1px solid #dc2626' : '1px solid #e8e8e8',marginBottom:'16px'}}>
              <div style={{fontSize:'14px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'20px'}}>Fotos *</div>
              <div style={{border:'2px dashed #e0e0e0',borderRadius:'8px',padding:'32px',textAlign:'center',marginBottom:'16px'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>📷</div>
                <div style={{fontSize:'13px',color:'#666',marginBottom:'12px'}}>
                  {isEditMode ? 'Actualiza tus fotos (' + fotos.length + ')' : 'Sube hasta ' + selectedPlan!.maxPhotos + ' fotos con el plan ' + selectedPlan!.name + ' (' + fotos.length + '/' + selectedPlan!.maxPhotos + ')'}
                </div>
                <label style={{background:'#E8390E',color:'white',padding:'10px 24px',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer',display:'inline-block'}}>
                  {uploading ? 'Subiendo...' : 'Seleccionar fotos'}
                  <input type="file" multiple accept="image/*" onChange={handleFoto} style={{display:'none'}} disabled={uploading || (!isEditMode && fotos.length >= (selectedPlan?.maxPhotos || 8))} />
                </label>
              </div>
              {errors.fotos && <div style={errorStyle}>{errors.fotos}</div>}
              {fotos.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginTop:'12px'}}>
                  {fotos.map((url,i) => (
                    <div key={i} style={{position:'relative'}}>
                      <img src={url} style={{width:'100%',height:'80px',objectFit:'cover',borderRadius:'4px'}} />
                      <button type="button" onClick={()=>setFotos(fotos.filter((_,j)=>j!==i))}
                        style={{position:'absolute',top:'4px',right:'4px',background:'#E8390E',color:'white',border:'none',borderRadius:'50%',width:'20px',height:'20px',cursor:'pointer',fontSize:'11px',fontWeight:700}}>
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {publishError && (
              <div style={{background:'#fee2e2',border:'1px solid #dc2626',borderRadius:'8px',padding:'14px 18px',marginBottom:'16px',color:'#991b1b',fontSize:'13px',fontWeight:600}}>
                {publishError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading || uploading || cajitaLoading || savingDraft}
              style={{width:'100%',padding:'14px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'15px',fontWeight:800,cursor: (loading||uploading||cajitaLoading||savingDraft) ? 'not-allowed' : 'pointer',textTransform:'uppercase'}}>
              {isEditMode ? (loading ? 'Guardando...' : 'Guardar cambios') :
               loading ? 'Publicando...' :
               cajitaLoading ? 'Abriendo pasarela...' :
               (selectedPlan && selectedPlan.priceCents > 0) ? 'Pagar $' + (selectedPlan.priceCents / 100).toFixed(0) + ' con PayPhone' :
               'Publicar moto'}
            </button>

            {!isEditMode && (
              <>
                <button onClick={handleSaveDraft} disabled={loading || uploading || cajitaLoading || savingDraft}
                  style={{width:'100%',padding:'12px',marginTop:'10px',background:'transparent',color:'#1E2340',border:'1px solid #1E2340',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor: (loading||uploading||cajitaLoading||savingDraft) ? 'not-allowed' : 'pointer',textTransform:'uppercase'}}>
                  {savingDraft ? 'Guardando...' : '💾 Guardar como borrador'}
                </button>
                <div style={{fontSize:'11px',color:'#888',marginTop:'8px',textAlign:'center'}}>
                  Puedes completar y pagar despues desde <strong>Mis Motos</strong>.
                </div>
              </>
            )}
            {isEditMode && (
              <button onClick={() => router.push('/mis-motos')}
                style={{width:'100%',padding:'12px',marginTop:'10px',background:'transparent',color:'#666',border:'1px solid #ccc',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>
                Cancelar
              </button>
            )}

            {/* Contenedor donde la Cajita de PayPhone se renderiza */}
            <div id="pp-button" style={{marginTop:'24px'}}></div>
          </fieldset>
        )}
      </div>
    </div>
  )
}


export default function PublicarPage() {
  return (
    <Suspense fallback={<div style={{padding:'40px',textAlign:'center',fontFamily:'Montserrat,sans-serif',color:'#888'}}>Cargando...</div>}>
      <PublicarContent />
    </Suspense>
  )
}
