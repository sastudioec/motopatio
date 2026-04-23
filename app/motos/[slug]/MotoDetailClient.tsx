'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/app/components/Breadcrumb'
import { calcularPicoYPlaca } from '@/lib/picoyplaca'

function truncateLabel(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function MotoDetailClient({ moto, marcaSlug }: { moto: any; marcaSlug?: string | null }) {
  const { data: session } = useSession()
  const [fotoActual, setFotoActual] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    if (shareOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shareOpen])

  // Lightbox: ESC cierra, flechas navegan, bloquea scroll del body
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowRight') setFotoActual(i => Math.min(i + 1, (moto?.fotos ? (JSON.parse(moto.fotos || '[]').length - 1) : 0)))
      else if (e.key === 'ArrowLeft') setFotoActual(i => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxOpen, moto])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const fotos = (() => { try { return JSON.parse(moto.fotos || '[]') } catch { return [] } })()
  const pyp = calcularPicoYPlaca(moto.placa || '', moto.ciudad || '')
  const ubicacion = moto.provincia ? (moto.ciudad + ', ' + moto.provincia) : moto.ciudad

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = moto.marca + ' ' + moto.modelo + ' ' + moto.anio + ' - $' + (moto.precio?.toLocaleString() || '')
  const shareText = 'Mira esta moto en MotoPatio: ' + shareTitle

  const handleShareClick = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareTitle, text: shareText, url: shareUrl })
        return
      } catch {}
    }
    setShareOpen(!shareOpen)
  }

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast('Link copiado! Pégalo donde quieras compartirlo')
      setShareOpen(false)
    } catch {
      setToast('No se pudo copiar')
    }
  }

  const copiarParaInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast('Link copiado. Pégalo en tu story o bio de Instagram')
      setShareOpen(false)
    } catch {
      setToast('No se pudo copiar')
    }
  }

  const urlEnc = encodeURIComponent(shareUrl)
  const textoEnc = encodeURIComponent(shareText)
  const enlacesShare = [
    { nombre: 'WhatsApp', bg: '#25D366', icon: 'W', url: 'https://wa.me/?text=' + textoEnc + '%20' + urlEnc, tipo: 'link' as const },
    { nombre: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', icon: 'ig', tipo: 'instagram' as const },
    { nombre: 'Facebook', bg: '#1877F2', icon: 'f', url: 'https://www.facebook.com/sharer/sharer.php?u=' + urlEnc, tipo: 'link' as const },
    { nombre: 'X (Twitter)', bg: '#000000', icon: 'X', url: 'https://twitter.com/intent/tweet?url=' + urlEnc + '&text=' + textoEnc, tipo: 'link' as const },
    { nombre: 'Telegram', bg: '#0088cc', icon: 'T', url: 'https://t.me/share/url?url=' + urlEnc + '&text=' + textoEnc, tipo: 'link' as const },
  ]

  const datosGrid = [
    {label:'Año', value: moto.anio},
    {label:'Kilometraje', value: moto.km?.toLocaleString() + ' km'},
    {label: moto.esElectrica ? 'Potencia' : 'Cilindraje', value: moto.cilindraje},
    {label:'Ciudad', value: moto.ciudad},
    {label:'Provincia', value: moto.provincia},
    {label:'Color', value: moto.color},
    {label:'Placa', value: moto.placa},
  ].filter(item => item.value)

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{maxWidth:'1000px',margin:'24px auto',padding:'0 20px'}}>
        <Breadcrumb items={[
          { label: 'Inicio', href: '/' },
          { label: 'Motos', href: '/motos' },
          marcaSlug ? { label: moto.marca, href: `/motos/marca/${marcaSlug}` } : { label: moto.marca },
          { label: truncateLabel(`${moto.marca} ${moto.modelo}`, 40) },
        ]} />

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}} className="grid-detalle">
          <div>
            <div onClick={() => fotos[fotoActual] && setLightboxOpen(true)}
              style={{background:'#e8e8e8',borderRadius:'8px',overflow:'hidden',marginBottom:'8px',height:'320px',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor: fotos[fotoActual] ? 'zoom-in' : 'default'}}>
              {fotos[fotoActual] ? (
                <>
                  <Image
                    src={fotos[fotoActual]}
                    alt={`${moto.marca} ${moto.modelo} ${moto.anio} - ${moto.ciudad} (foto ${fotoActual + 1})`}
                    width={1200}
                    height={800}
                    priority
                    sizes="(max-width: 900px) 100vw, 500px"
                    style={{width:'100%',height:'100%',objectFit:'cover'}}
                  />
                  <div style={{position:'absolute',top:'10px',right:'10px',background:'rgba(0,0,0,0.55)',color:'#fff',padding:'6px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px',pointerEvents:'none'}}>
                    🔍 Ver completa
                  </div>
                  {fotos.length > 1 && (
                    <div style={{position:'absolute',bottom:'10px',right:'10px',background:'rgba(0,0,0,0.55)',color:'#fff',padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,pointerEvents:'none'}}>
                      {fotoActual + 1} / {fotos.length}
                    </div>
                  )}
                </>
              ) : (
                <span style={{fontSize:'64px'}}>🏍️</span>
              )}
            </div>
            {fotos.length > 1 && (
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {fotos.map((f: string, i: number) => (
                  <Image key={i} src={f} onClick={() => setFotoActual(i)}
                    alt={`${moto.marca} ${moto.modelo} ${moto.anio} - miniatura ${i + 1}`}
                    width={64}
                    height={64}
                    sizes="64px"
                    style={{width:'64px',height:'64px',objectFit:'cover',borderRadius:'4px',cursor:'pointer',border: i === fotoActual ? '2px solid #E8390E' : '2px solid transparent'}} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
              {moto.tipo && <div style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textTransform:'uppercase'}}>{moto.tipo}</div>}
              {moto.esElectrica && (
                <div style={{background:'#10B981',color:'white',fontSize:'10px',fontWeight:800,padding:'3px 8px',borderRadius:'3px',textTransform:'uppercase'}}>⚡ Eléctrica</div>
              )}
            </div>
            <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'26px',fontWeight:900,color:'#1E2340',textTransform:'uppercase',marginBottom:'4px'}}>{moto.marca} {moto.modelo}</h1>
            {moto.publicId && <div style={{fontSize:'11px',color:'#888',marginBottom:'4px'}}>Código: <span style={{fontFamily:'monospace',fontWeight:700,color:'#1E2340',letterSpacing:'0.5px'}}>{moto.publicId}</span></div>}
            {ubicacion && <div style={{fontSize:'13px',color:'#666',marginBottom:'8px'}}>📍 {ubicacion}</div>}

            {/* Precio + botón compartir lado a lado */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginBottom:'16px',flexWrap:'wrap'}}>
              <div style={{fontFamily:'Poppins,sans-serif',fontSize:'32px',fontWeight:900,color:'#E8390E'}}>${moto.precio?.toLocaleString()}</div>

              <div ref={shareRef} style={{position:'relative'}}>
                <button onClick={handleShareClick}
                  style={{display:'flex',alignItems:'center',gap:'8px',background:'#25D366',border:'none',color:'#fff',padding:'10px 18px',borderRadius:'6px',fontSize:'14px',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 6px rgba(37,211,102,0.3)'}}>
                  <span style={{fontSize:'16px'}}>↗</span> Compartir
                </button>
                {shareOpen && (
                  <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#fff',border:'1px solid #e0e0e0',borderRadius:'8px',boxShadow:'0 6px 20px rgba(0,0,0,0.12)',padding:'8px',minWidth:'220px',zIndex:50}}>
                    {enlacesShare.map(s => s.tipo === 'link' ? (
                      <a key={s.nombre} href={s.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => setShareOpen(false)}
                        style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',textDecoration:'none',borderRadius:'4px',color:'#1E2340',fontSize:'13px',fontWeight:600}}>
                        <span style={{width:'26px',height:'26px',borderRadius:'50%',background:s.bg,color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800}}>{s.icon}</span>
                        {s.nombre}
                      </a>
                    ) : (
                      <button key={s.nombre} onClick={copiarParaInstagram}
                        style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'transparent',border:'none',borderRadius:'4px',color:'#1E2340',fontSize:'13px',fontWeight:600,cursor:'pointer',textAlign:'left'}}>
                        <span style={{width:'26px',height:'26px',borderRadius:'50%',background:s.bg,color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800}}>{s.icon}</span>
                        {s.nombre}
                      </button>
                    ))}
                    <div style={{height:'1px',background:'#f0f0f0',margin:'4px 0'}} />
                    <button onClick={copiarLink}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'transparent',border:'none',borderRadius:'4px',color:'#1E2340',fontSize:'13px',fontWeight:600,cursor:'pointer',textAlign:'left'}}>
                      <span style={{width:'26px',height:'26px',borderRadius:'50%',background:'#666',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:800}}>⧉</span>
                      Copiar link
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}}>
              {datosGrid.map(item => (
                <div key={item.label} style={{background:'#fff',padding:'10px 12px',borderRadius:'4px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:'10px',color:'#888',fontWeight:600,textTransform:'uppercase'}}>{item.label}</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340'}}>{item.value}</div>
                </div>
              ))}
            </div>

            {pyp.aplica && pyp.diaNombre && (
              <div style={{background:'#FEF3C7',border:'1.5px solid #F59E0B',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                  <span style={{fontSize:'22px'}}>🚦</span>
                  <div style={{fontSize:'13px',fontWeight:800,color:'#92400E',textTransform:'uppercase'}}>Pico y Placa Quito</div>
                </div>
                <div style={{fontSize:'14px',color:'#78350F',lineHeight:1.5}}>
                  Esta moto <strong>no puede circular los {pyp.diaNombre}s</strong> en horario pico
                  ({pyp.horarios.join(' y ')}).
                  <div style={{fontSize:'12px',color:'#92400E',marginTop:'6px'}}>Último dígito de placa: <strong>{pyp.ultimoDigito}</strong> · Sábados, domingos y feriados circula libre.</div>
                </div>
              </div>
            )}
            {!pyp.aplica && moto.ciudad && (
              <div style={{background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:'8px',padding:'12px',marginBottom:'16px'}}>
                <div style={{fontSize:'13px',color:'#065F46',fontWeight:600}}>
                  ✓ Sin Pico y Placa en {moto.ciudad}
                </div>
              </div>
            )}

            {session ? (
              <div style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'16px'}}>
                <div style={{fontSize:'12px',color:'#888',marginBottom:'4px'}}>Vendedor</div>
                <div style={{fontSize:'15px',fontWeight:700,color:'#1E2340',marginBottom:'12px'}}>{moto.user?.name || 'Usuario'}</div>
                <a href={'https://wa.me/593' + (moto.user?.phone || '').replace(/\D/g,'')} target="_blank"
                  style={{display:'block',background:'#25D366',color:'white',padding:'12px',borderRadius:'4px',fontSize:'14px',fontWeight:800,textDecoration:'none',textAlign:'center'}}>
                  Contactar por WhatsApp
                </a>
              </div>
            ) : (
              <div style={{background:'#1E2340',borderRadius:'8px',padding:'16px',textAlign:'center'}}>
                <div style={{color:'#ccc',fontSize:'13px',marginBottom:'10px'}}>Inicia sesión para ver el contacto del vendedor</div>
                <Link href="/auth/login" style={{background:'#E8390E',color:'white',padding:'10px 24px',borderRadius:'4px',fontSize:'13px',fontWeight:700,textDecoration:'none',display:'inline-block'}}>
                  Ingresar
                </Link>
              </div>
            )}
          </div>
        </div>

        {moto.descripcion && (
          <div style={{background:'#fff',borderRadius:'8px',padding:'24px',border:'1px solid #e8e8e8',marginTop:'16px'}}>
            <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340',marginBottom:'12px',textTransform:'uppercase'}}>Descripción</div>
            <p style={{fontSize:'14px',color:'#555',lineHeight:'1.6',whiteSpace:'pre-wrap'}}>{moto.descripcion}</p>
          </div>
        )}
      </div>

      {/* Lightbox - Galeria fullscreen al hacer click en foto */}
      {lightboxOpen && fotos[fotoActual] && (
        <div onClick={() => setLightboxOpen(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',zIndex:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>

          {/* Botón cerrar */}
          <button onClick={(e) => {e.stopPropagation(); setLightboxOpen(false)}}
            style={{position:'absolute',top:'16px',right:'16px',width:'44px',height:'44px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:'22px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}
            aria-label="Cerrar">✕</button>

          {/* Contador */}
          <div style={{position:'absolute',top:'22px',left:'50%',transform:'translateX(-50%)',color:'#fff',fontSize:'13px',fontWeight:600,opacity:0.85,letterSpacing:'0.5px'}}>
            {fotoActual + 1} / {fotos.length}
          </div>

          {/* Flecha izquierda */}
          {fotos.length > 1 && (
            <button onClick={(e) => {e.stopPropagation(); setFotoActual(i => Math.max(i - 1, 0))}}
              disabled={fotoActual === 0}
              className="lightbox-arrow lightbox-arrow-left"
              style={{position:'absolute',left:'16px',top:'50%',transform:'translateY(-50%)',width:'48px',height:'48px',borderRadius:'50%',background: fotoActual === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',border:'none',color:'#fff',fontSize:'24px',cursor: fotoActual === 0 ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity: fotoActual === 0 ? 0.4 : 1,zIndex:10}}
              aria-label="Anterior">‹</button>
          )}

          {/* Foto grande */}
          <div onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return
              const dx = e.changedTouches[0].clientX - touchStartX
              if (Math.abs(dx) > 50) {
                if (dx < 0) setFotoActual(i => Math.min(i + 1, fotos.length - 1))
                else setFotoActual(i => Math.max(i - 1, 0))
              }
              setTouchStartX(null)
            }}
            style={{width:'calc(100vw - 120px)',maxWidth:'1200px',height:'calc(100vh - 200px)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Image src={fotos[fotoActual]}
              alt={`${moto.marca} ${moto.modelo} ${moto.anio} - ${moto.ciudad} (foto ${fotoActual + 1})`}
              width={1600}
              height={1200}
              sizes="100vw"
              style={{maxWidth:'100%',maxHeight:'100%',width:'auto',height:'auto',objectFit:'contain',userSelect:'none'}}
              draggable={false} />
          </div>

          {/* Flecha derecha */}
          {fotos.length > 1 && (
            <button onClick={(e) => {e.stopPropagation(); setFotoActual(i => Math.min(i + 1, fotos.length - 1))}}
              disabled={fotoActual === fotos.length - 1}
              className="lightbox-arrow lightbox-arrow-right"
              style={{position:'absolute',right:'16px',top:'50%',transform:'translateY(-50%)',width:'48px',height:'48px',borderRadius:'50%',background: fotoActual === fotos.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',border:'none',color:'#fff',fontSize:'24px',cursor: fotoActual === fotos.length - 1 ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity: fotoActual === fotos.length - 1 ? 0.4 : 1,zIndex:10}}
              aria-label="Siguiente">›</button>
          )}

          {/* Thumbnails abajo */}
          {fotos.length > 1 && (
            <div onClick={(e) => e.stopPropagation()}
              style={{position:'absolute',bottom:'20px',left:'50%',transform:'translateX(-50%)',display:'flex',gap:'8px',padding:'10px',background:'rgba(0,0,0,0.4)',borderRadius:'10px',maxWidth:'calc(100vw - 40px)',overflowX:'auto'}}>
              {fotos.map((f: string, i: number) => (
                <Image key={i} src={f} onClick={() => setFotoActual(i)}
                  alt={`${moto.marca} ${moto.modelo} ${moto.anio} - miniatura ${i + 1}`}
                  width={54}
                  height={54}
                  sizes="54px"
                  style={{width:'54px',height:'54px',objectFit:'cover',borderRadius:'4px',cursor:'pointer',flexShrink:0,border: i === fotoActual ? '2px solid #E8390E' : '2px solid transparent',opacity: i === fotoActual ? 1 : 0.65}} />
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',background:'#1E2340',color:'#fff',padding:'12px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:600,boxShadow:'0 6px 20px rgba(0,0,0,0.2)',zIndex:100,maxWidth:'90vw',textAlign:'center'}}>
          {toast}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 760px) {
          .grid-detalle { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
