'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'

interface Props {
  bannerSlot?: ReactNode
}

export default function Hero({ bannerSlot }: Props) {
  const router = useRouter()
  const [marca, setMarca] = useState('')
  const [tipo, setTipo] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (marca) params.set('marca', marca)
    if (tipo) params.set('tipo', tipo)
    if (ciudad) params.set('ciudad', ciudad)
    router.push('/motos?' + params.toString())
  }

  const selectStyle = {
    flex: 1,
    minWidth: 0,
    background: 'rgba(30, 35, 64, 0.92)',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    padding: isMobile ? '11px 6px' : '13px 10px',
    fontSize: isMobile ? '11px' : '12px',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
    appearance: 'none' as const,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#1E2340',
        overflow: 'hidden',
        minHeight: isMobile ? '260px' : '360px',
      }}
    >
      {bannerSlot}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '24px 12px' : '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: isMobile ? '260px' : '360px',
          boxSizing: 'border-box',
        }}
      >
        <h1 className="sr-only">Motos usadas y nuevas en Ecuador</h1>
        <p className="sr-only">
          Compra, vende y publica motos en Quito, Guayaquil, Cuenca y todo el país. Shineray, Honda, Yamaha, Bajaj, Suzuki y más de 20 marcas.
        </p>
        <div
          style={{
            display: 'flex',
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%',
            border: '2px solid #E8390E',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          }}
        >
          <select value={marca} onChange={e => setMarca(e.target.value)} style={selectStyle}>
            <option value="">Marca</option>
            <option>Yamaha</option><option>Honda</option><option>Suzuki</option>
            <option>Kawasaki</option><option>AKT</option><option>Bera</option>
            <option>TVS</option><option>Shineray</option>
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={selectStyle}>
            <option value="">Tipo</option>
            <option>Urbana</option><option>Naked</option><option>Trail</option>
            <option>Scooter</option><option>Deportiva</option><option>Crucero</option>
          </select>
          <select value={ciudad} onChange={e => setCiudad(e.target.value)} style={selectStyle}>
            <option value="">Ciudad</option>
            <option>Quito</option><option>Guayaquil</option><option>Cuenca</option>
            <option>Ambato</option><option>Loja</option><option>Ibarra</option>
          </select>
          <button
            onClick={handleSearch}
            style={{
              background: '#E8390E',
              color: 'white',
              border: 'none',
              padding: isMobile ? '11px 14px' : '13px 28px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: isMobile ? '11px' : '13px',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: isMobile ? '0' : '1px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  )
}
