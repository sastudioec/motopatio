'use client'
import { useRouter } from 'next/navigation'
import { useState, useMemo, ReactNode } from 'react'
import { getProvincias, getCiudadesByProvincia } from '@/lib/provincias-ecuador'

interface Props {
  bannerSlot?: ReactNode
}

export default function Hero({ bannerSlot }: Props) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')

  const provincias = useMemo(() => getProvincias(), [])
  const ciudades = useMemo(() => (provincia ? getCiudadesByProvincia(provincia) : []), [provincia])

  const handleProvinciaChange = (val: string) => {
    setProvincia(val)
    setCiudad('')
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    const q = texto.trim()
    if (q) params.set('buscar', q)
    if (provincia) params.set('provincia', provincia)
    if (ciudad) params.set('ciudad', ciudad)
    const qs = params.toString()
    router.push(qs ? `/motos?${qs}` : '/motos')
  }

  const srOnly: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
  }

  return (
    <>
      <h1 style={srOnly}>Motos usadas y nuevas en Ecuador</h1>
      <p style={srOnly}>
        Compra, vende y publica motos en Quito, Guayaquil, Cuenca y todo el país. Shineray, Honda, Yamaha, Bajaj, Suzuki y más de 20 marcas.
      </p>

      <div className="hero-wrap">
        <div className="hero-banner">
          {bannerSlot}
        </div>
        <div className="hero-search-position">
          <div className="hero-search-bar">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Marca, modelo o lo que busques..."
              className="hero-search-input"
              aria-label="Buscar"
            />
            <select
              value={provincia}
              onChange={e => handleProvinciaChange(e.target.value)}
              className="hero-search-select"
              aria-label="Provincia"
            >
              <option value="">Provincia</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              className="hero-search-select"
              disabled={!provincia}
              aria-label="Ciudad"
            >
              <option value="">Ciudad</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleSearch} className="hero-search-btn">
              Buscar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-wrap {
          position: relative;
        }
        .hero-banner {
          position: relative;
          background: #1E2340;
          overflow: hidden;
          width: 100%;
          aspect-ratio: 820 / 312;
        }
        .hero-search-position {
          background: #1E2340;
          padding: 14px 12px;
          display: flex;
          justify-content: center;
        }
        .hero-search-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          max-width: 900px;
        }
        .hero-search-input,
        .hero-search-select,
        .hero-search-btn {
          border: 2px solid #E8390E;
          border-radius: 4px;
          box-sizing: border-box;
          font-family: Montserrat, sans-serif;
        }
        .hero-search-input {
          flex: 1 1 100%;
          min-width: 0;
          padding: 11px 12px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(30, 35, 64, 0.92);
          color: #fff;
          outline: none;
        }
        .hero-search-input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }
        .hero-search-select {
          flex: 1 1 0;
          min-width: 0;
          padding: 11px 6px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(30, 35, 64, 0.92);
          color: #fff;
          text-transform: uppercase;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .hero-search-select:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .hero-search-btn {
          flex: 0 0 auto;
          padding: 11px 18px;
          background: #E8390E;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
        }
        @media (min-width: 720px) {
          .hero-banner {
            aspect-ratio: auto;
            height: 400px;
          }
          .hero-search-position {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 20px;
            padding: 0 12px;
            background: transparent;
            z-index: 2;
          }
          .hero-search-bar {
            gap: 0;
            border: 2px solid #E8390E;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(4px);
          }
          .hero-search-input,
          .hero-search-select,
          .hero-search-btn {
            border: none;
            border-radius: 0;
          }
          .hero-search-input,
          .hero-search-select {
            border-right: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(30, 35, 64, 0.85);
          }
          .hero-search-input {
            flex: 1 1 0;
            padding: 13px 14px;
            font-size: 14px;
          }
          .hero-search-select {
            padding: 13px 10px;
            font-size: 12px;
          }
          .hero-search-btn {
            padding: 13px 28px;
            font-size: 13px;
            letter-spacing: 1px;
          }
        }
      `}</style>
    </>
  )
}
