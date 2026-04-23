'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { openCajita } from '@/lib/cajita'

export default function MisMotosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [motos, setMotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMoto, setModalMoto] = useState<any>(null)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [destacarLoading, setDestacarLoading] = useState(false)
  const [destacarError, setDestacarError] = useState<string | null>(null)

  const handleDestacar = async (listingId: string) => {
    setDestacarError(null)
    setDestacarLoading(true)
    try {
      const res = await fetch('/api/pagos/destacar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDestacarError(data.error || data.message || 'No se pudo iniciar el pago')
        setDestacarLoading(false)
        return
      }
      await openCajita(data.cajita, 'pp-button-destacar')
      // Cajita se encarga del redirect a /api/pagos/confirmar tras el pago.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al abrir pasarela'
      setDestacarError(msg)
      setDestacarLoading(false)
    }
  }

  const copiarCodigo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiado(code)
      setTimeout(() => setCopiado(c => c === code ? null : c), 1500)
    } catch {}
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status])

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/mis-motos')
        .then(r => r.json())
        .then(data => {
          setMotos(data.listings || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const handleEstado = async (id: string, estado: string) => {
    setProcesando(id)
    try {
      const res = await fetch('/api/mis-motos/' + id, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setMotos(motos.map(m => m.id === id ? {...m, estado} : m))
      } else {
        const d = await res.json()
        alert('Error: ' + (d.error || 'No se pudo actualizar'))
      }
    } catch {
      alert('Error de conexion')
    }
    setProcesando(null)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('Seguro que quieres eliminar esta publicacion? Esta accion no se puede deshacer.')) return
    setProcesando(id)
    try {
      const res = await fetch('/api/mis-motos/' + id, { method: 'DELETE' })
      if (res.ok) {
        setMotos(motos.filter(m => m.id !== id))
      } else {
        const d = await res.json()
        alert('Error: ' + (d.error || 'No se pudo eliminar'))
      }
    } catch {
      alert('Error de conexion')
    }
    setProcesando(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
        
        <div style={{padding:'40px',textAlign:'center'}}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      

      <div style={{maxWidth:'800px',margin:'32px auto',padding:'0 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
          <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'24px',fontWeight:900,color:'#1E2340'}}>Mis motos</h1>
          <Link href="/publicar" style={{background:'#E8390E',color:'white',padding:'10px 20px',borderRadius:'4px',fontSize:'13px',fontWeight:700,textDecoration:'none'}}>+ Nueva publicacion</Link>
        </div>

        {motos.length === 0 ? (
          <div style={{background:'#fff',borderRadius:'8px',padding:'48px',textAlign:'center',border:'1px solid #e8e8e8'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>🏍️</div>
            <div style={{fontSize:'16px',fontWeight:700,color:'#1E2340',marginBottom:'8px'}}>No tienes motos publicadas</div>
            <p style={{fontSize:'13px',color:'#888',marginBottom:'24px'}}>Publica tu primera moto y llega a miles de compradores</p>
            <Link href="/publicar" style={{background:'#E8390E',color:'white',padding:'12px 32px',borderRadius:'4px',fontSize:'14px',fontWeight:800,textDecoration:'none'}}>Publicar mi moto</Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {motos.map(moto => {
              const fotos = (() => { try { return JSON.parse(moto.fotos || '[]') } catch { return [] } })()
              const activo = moto.estado === 'activo'
              const esBorrador = moto.estado === 'borrador'
              const planTipo = moto.planTipo || 'gratis'
              const disabled = procesando === moto.id
              return (
                <div key={moto.id} style={{background: esBorrador ? '#fafafa' : '#fff',borderRadius:'8px',border: esBorrador ? '1px dashed #c7c7c7' : '1px solid #e8e8e8',overflow:'hidden', opacity: disabled ? 0.6 : 1}}>
                  <div style={{display:'flex'}}>
                    <div style={{width:'120px',height:'120px',flexShrink:0,background:'#e8e8e8',overflow:'hidden',opacity: activo ? 1 : esBorrador ? 0.45 : 0.5}}>
                      {fotos[0] ? (
                        <Image
                          src={fotos[0]}
                          alt={`${moto.marca} ${moto.modelo} ${moto.anio} - ${moto.ciudad}`}
                          width={120}
                          height={120}
                          sizes="120px"
                          style={{width:'120px',height:'120px',objectFit:'cover',display:'block'}}
                        />
                      ) : <div style={{width:'120px',height:'120px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px'}}>🏍️</div>}
                    </div>
                    <div style={{padding:'14px 16px',flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                        <div>
                          <div style={{fontSize:'15px',fontWeight:700,color:'#1E2340',textTransform:'uppercase'}}>{moto.marca} {moto.modelo}</div>
                          <div style={{fontSize:'18px',fontWeight:800,color:'#E8390E'}}>${moto.precio?.toLocaleString()}</div>
                          <div style={{fontSize:'11px',color:'#999',display:'flex',gap:'10px',marginTop:'2px'}}>
                            <span>{moto.anio}</span>
                            <span>{moto.km?.toLocaleString()} km</span>
                            <span>{moto.ciudad}</span>
                          </div>
                          {moto.publicId && !esBorrador && (
                            <button
                              type="button"
                              onClick={() => copiarCodigo(moto.publicId)}
                              title="Clic para copiar"
                              style={{marginTop:'6px',background:'#f4f4f4',border:'1px solid #e0e0e0',borderRadius:'4px',padding:'3px 8px',fontSize:'11px',fontFamily:'monospace',fontWeight:700,color:'#1E2340',letterSpacing:'0.5px',cursor:'pointer'}}>
                              {copiado === moto.publicId ? '✓ Copiado' : moto.publicId}
                            </button>
                          )}
                        </div>
                        <div style={{display:'flex',gap:'6px',flexDirection:'column',alignItems:'flex-end'}}>
                          <span style={{background: activo ? '#E1F5EE' : esBorrador ? '#FEF3C7' : '#f4f4f4', color: activo ? '#0F6E56' : esBorrador ? '#92400E' : '#888', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, textTransform:'uppercase'}}>
                            {moto.estado}
                          </span>
                          <span style={{background: planTipo === 'full' ? '#FFF3E0' : planTipo === 'basico' ? '#EEF2FF' : '#f4f4f4', color: planTipo === 'full' ? '#B45309' : planTipo === 'basico' ? '#4338CA' : '#888', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700}}>
                            {planTipo}
                          </span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        {esBorrador ? (
                          <>
                            <Link href={'/publicar?draft=' + moto.id}
                              style={{background:'#E8390E',color:'#fff',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>
                              Continuar
                            </Link>
                            <button onClick={() => handleEliminar(moto.id)} disabled={disabled}
                              style={{background:'transparent',color:'#A32D2D',border:'1px solid #F5C7C7',padding:'5px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor: disabled ? 'not-allowed' : 'pointer'}}>
                              {disabled ? '...' : 'Eliminar'}
                            </button>
                          </>
                        ) : (
                          <>
                            <Link href={'/publicar?edit=' + moto.id}
                              style={{background:'#1E2340',color:'#fff',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>
                              ✎ Editar
                            </Link>
                            <Link href={'/motos/' + (moto.slug || moto.id)}
                              style={{background:'#f4f4f4',color:'#333',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>
                              Ver
                            </Link>
                            {activo ? (
                              <button onClick={() => handleEstado(moto.id, 'suspendido')} disabled={disabled}
                                style={{background:'#FFF8E1',color:'#B45309',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor: disabled ? 'not-allowed' : 'pointer'}}>
                                {disabled ? '...' : 'Suspender'}
                              </button>
                            ) : (
                              <button onClick={() => handleEstado(moto.id, 'activo')} disabled={disabled}
                                style={{background:'#E1F5EE',color:'#0F6E56',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor: disabled ? 'not-allowed' : 'pointer'}}>
                                {disabled ? '...' : 'Reactivar'}
                              </button>
                            )}
                            {planTipo !== 'gratis' && (
                              <button onClick={() => setModalMoto(moto)}
                                style={{background:'#EEF2FF',color:'#4338CA',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
                                ⭐ Promocionar
                              </button>
                            )}
                            {planTipo === 'gratis' && (
                              <button onClick={() => setModalMoto(moto)}
                                style={{background:'#FFF3E0',color:'#B45309',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
                                🚀 Mejorar plan
                              </button>
                            )}
                            <button onClick={() => handleEliminar(moto.id)} disabled={disabled}
                              style={{background:'#FCEBEB',color:'#A32D2D',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor: disabled ? 'not-allowed' : 'pointer'}}>
                              {disabled ? '...' : 'Eliminar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalMoto && (() => {
        const ahora = Date.now()
        const destacadoActivo =
          !!modalMoto.destacadoHasta &&
          new Date(modalMoto.destacadoHasta).getTime() > ahora
        const listingVigente =
          modalMoto.estado === 'activo' &&
          !!modalMoto.expiraEn &&
          new Date(modalMoto.expiraEn).getTime() > ahora
        const puedeDestacar = listingVigente && !destacadoActivo
        const fechaDestacado = destacadoActivo
          ? new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(modalMoto.destacadoHasta))
          : null
        const renderDestacarCard = () => (
          <div style={{border:'1px solid #e0e0e0',borderRadius:'8px',padding:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div style={{fontWeight:700,color:'#1E2340'}}>⭐ Destacar moto</div>
              <div style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#E8390E'}}>$7</div>
            </div>
            <div style={{fontSize:'12px',color:'#666',marginBottom:'12px'}}>Aparece primero en el catalogo por 7 dias</div>
            {destacadoActivo ? (
              <button disabled style={{width:'100%',padding:'10px',background:'#e0e0e0',color:'#888',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'not-allowed'}}>
                Ya destacado hasta {fechaDestacado}
              </button>
            ) : !listingVigente ? (
              <button disabled style={{width:'100%',padding:'10px',background:'#e0e0e0',color:'#888',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'not-allowed'}}>
                Renueva el plan para destacar
              </button>
            ) : (
              <button
                onClick={() => handleDestacar(modalMoto.id)}
                disabled={destacarLoading}
                style={{width:'100%',padding:'10px',background:'#1E2340',color:'white',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor: destacarLoading ? 'wait' : 'pointer',opacity: destacarLoading ? 0.7 : 1}}>
                {destacarLoading ? 'Abriendo pasarela...' : 'Pagar $7'}
              </button>
            )}
          </div>
        )
        return (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'12px',padding:'32px',maxWidth:'480px',width:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
              <div style={{fontFamily:'Poppins,sans-serif',fontSize:'18px',fontWeight:900,color:'#1E2340'}}>
                {modalMoto.planTipo === 'gratis' ? 'Mejorar plan' : 'Promocionar moto'}
              </div>
              <button onClick={() => { setModalMoto(null); setDestacarError(null); setDestacarLoading(false) }} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#888'}}>✕</button>
            </div>
            <div style={{fontSize:'13px',color:'#888',marginBottom:'20px'}}>
              <strong style={{color:'#1E2340'}}>{modalMoto.marca} {modalMoto.modelo}</strong> — Plan actual: <strong>{modalMoto.planTipo || 'gratis'}</strong>
            </div>
            {destacarError && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#b91c1c',padding:'10px 12px',borderRadius:'6px',fontSize:'13px',marginBottom:'14px'}}>
                {destacarError}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {(modalMoto.planTipo === 'gratis' || !modalMoto.planTipo) && (
                <>
                  <div style={{border:'1px solid #e0e0e0',borderRadius:'8px',padding:'16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <div style={{fontWeight:700,color:'#1E2340'}}>Plan Basico</div>
                      <div style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#E8390E'}}>$5</div>
                    </div>
                    <div style={{fontSize:'12px',color:'#666',marginBottom:'12px'}}>15 dias activa · Hasta 8 fotos</div>
                    <button style={{width:'100%',padding:'10px',background:'#1E2340',color:'white',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                      Pagar $5 — Proximamente
                    </button>
                  </div>
                  <div style={{border:'2px solid #E8390E',borderRadius:'8px',padding:'16px',position:'relative'}}>
                    <div style={{position:'absolute',top:'-10px',left:'16px',background:'#E8390E',color:'white',fontSize:'10px',fontWeight:800,padding:'2px 10px',borderRadius:'10px'}}>RECOMENDADO</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <div style={{fontWeight:700,color:'#1E2340'}}>Plan Full</div>
                      <div style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#E8390E'}}>$10</div>
                    </div>
                    <div style={{fontSize:'12px',color:'#666',marginBottom:'12px'}}>30 dias activa · Destacado 7 dias incluido</div>
                    <button style={{width:'100%',padding:'10px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                      Pagar $10 — Proximamente
                    </button>
                  </div>
                </>
              )}
              {modalMoto.planTipo === 'basico' && (
                <>
                  {renderDestacarCard()}
                  <div style={{border:'2px solid #E8390E',borderRadius:'8px',padding:'16px',position:'relative'}}>
                    <div style={{position:'absolute',top:'-10px',left:'16px',background:'#E8390E',color:'white',fontSize:'10px',fontWeight:800,padding:'2px 10px',borderRadius:'10px'}}>MEJOR VALOR</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <div style={{fontWeight:700,color:'#1E2340'}}>Subir a Full</div>
                      <div style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#E8390E'}}>$10</div>
                    </div>
                    <div style={{fontSize:'12px',color:'#666',marginBottom:'12px'}}>30 dias activa · Destacado 7 dias incluido</div>
                    <button style={{width:'100%',padding:'10px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                      Pagar $10 — Proximamente
                    </button>
                  </div>
                </>
              )}
              {modalMoto.planTipo === 'full' && renderDestacarCard()}
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
