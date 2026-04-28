'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LeadsDateFilter from '@/app/components/LeadsDateFilter'
import ListingHistorialModal from '@/app/components/ListingHistorialModal'
import DealerActivityModal from '@/app/components/DealerActivityModal'
import { formatFechaCorta } from '@/lib/format-date'

type Tab = 'dashboard' | 'motos' | 'usuarios' | 'publicidad' | 'dealers' | 'leads'

export default function AdminPage() {
  // Suspense necesario para useSearchParams (Next 15 strict)
  return (
    <Suspense fallback={null}>
      <AdminPageInner />
    </Suspense>
  )
}

function AdminPageInner() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const sp = useSearchParams()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [motos, setMotos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [dealers, setDealers] = useState<any[]>([])
  const [dealerFilter, setDealerFilter] = useState<'pending_approval' | 'approved' | 'rejected' | 'todos'>('pending_approval')
  const [leadsAdmin, setLeadsAdmin] = useState<any[]>([])
  const [leadsFilter, setLeadsFilter] = useState<{ tipo: 'todos' | 'dealer' | 'user'; financiamiento: 'todos' | 'si' | 'no' }>({ tipo: 'todos', financiamiento: 'todos' })
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // Estado del formulario de banners
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [showBannerForm, setShowBannerForm] = useState(false)

  // Modal de Historial (audit log) de un listing
  const [historialMotoId, setHistorialMotoId] = useState<string | null>(null)

  // Modal de Actividad de un dealer
  const [actividadDealer, setActividadDealer] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status])

  useEffect(() => {
    if (session?.user) {
      fetch('/api/admin/stats').then(r => r.json()).then(data => {
        if (data.error) { alert('Error: ' + data.error); return }
        setStats(data)
        setLoading(false)
      })
    }
  }, [session])

  useEffect(() => {
    if (tab === 'motos') {
      fetch('/api/admin/motos').then(r => r.json()).then(data => setMotos(data.listings || []))
    }
    if (tab === 'usuarios') {
      fetch('/api/admin/usuarios').then(r => r.json()).then(data => setUsuarios(data.users || []))
    }
    if (tab === 'publicidad') {
      loadBanners()
    }
    if (tab === 'dealers') {
      fetch('/api/admin/dealers?status=' + dealerFilter).then(r => r.json()).then(d => setDealers(d.dealers || []))
    }
    if (tab === 'leads') {
      const qs = new URLSearchParams()
      if (leadsFilter.tipo !== 'todos') qs.set('tipo', leadsFilter.tipo)
      if (leadsFilter.financiamiento !== 'todos') qs.set('financiamiento', leadsFilter.financiamiento)
      const desde = sp.get('desde'); const hasta = sp.get('hasta')
      if (desde) qs.set('desde', desde)
      if (hasta) qs.set('hasta', hasta)
      fetch('/api/admin/leads?' + qs.toString()).then(r => r.json()).then(d => setLeadsAdmin(d.leads || []))
    }
  }, [tab, dealerFilter, leadsFilter, sp])

  const reloadDealers = () => {
    fetch('/api/admin/dealers?status=' + dealerFilter).then(r => r.json()).then(d => setDealers(d.dealers || []))
  }
  const handleDealerApprove = async (id: string) => {
    if (!confirm('¿Aprobar este concesionario? Se hará público y se enviará email.')) return
    const res = await fetch('/api/admin/dealers/' + id + '/approve', { method: 'POST' })
    if (!res.ok) { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo')); return }
    reloadDealers()
  }
  const handleDealerReject = async (id: string) => {
    const notes = prompt('Nota opcional para el dealer (visible en su panel):') || ''
    if (!confirm('¿Rechazar este concesionario? Se enviará email.')) return
    const res = await fetch('/api/admin/dealers/' + id + '/reject', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ notes }),
    })
    if (!res.ok) { const d = await res.json(); alert('Error: ' + (d.error || 'No se pudo')); return }
    reloadDealers()
  }

  const loadBanners = () =>
    fetch('/api/admin/banners').then(r => r.json()).then(d => setBanners(d.banners || []))

  const handleMotoEstado = async (id: string, estado: string) => {
    await fetch('/api/admin/motos/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ estado }),
    })
    setMotos(motos.map(m => m.id === id ? {...m, estado} : m))
  }

  const handleUsuarioBloqueo = async (id: string, blocked: boolean) => {
    await fetch('/api/admin/usuarios/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ blocked }),
    })
    setUsuarios(usuarios.map(u => u.id === id ? {...u, blocked} : u))
  }

  const handleEliminarUsuario = async (id: string) => {
    if (!confirm('Seguro que quieres eliminar este usuario y todas sus motos?')) return
    await fetch('/api/admin/usuarios/' + id, { method: 'DELETE' })
    setUsuarios(usuarios.filter(u => u.id !== id))
  }

  const handleEliminarMoto = async (id: string) => {
    if (!confirm('Seguro que quieres eliminar esta moto?')) return
    await fetch('/api/admin/motos/' + id, { method: 'DELETE' })
    setMotos(motos.filter(m => m.id !== id))
  }

  // === Banners ===
  const handleEliminarBanner = async (id: string) => {
    if (!confirm('Seguro que quieres eliminar este banner? Se borrarán sus estadísticas también.')) return
    await fetch('/api/admin/banners/' + id, { method: 'DELETE' })
    setBanners(banners.filter(b => b.id !== id))
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch('/api/admin/banners/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ active }),
    })
    setBanners(banners.map(b => b.id === id ? {...b, active} : b))
  }

  if (status === 'loading' || loading) return <div style={{padding:'40px',textAlign:'center'}}>Cargando...</div>

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{background:'#1E2340',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px',borderBottom:'3px solid #E8390E'}}>
        <Link href="/" style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#fff',textDecoration:'none'}}>
          MOTO<span style={{color:'#E8390E'}}>PATÍO</span> <span style={{fontSize:'12px',color:'#E8390E',fontWeight:600}}>ADMIN</span>
        </Link>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <Link href="/" style={{color:'#ccc',fontSize:'13px',textDecoration:'none'}}>← Volver al sitio</Link>
          <button onClick={() => signOut({callbackUrl:'/'})} style={{background:'transparent',color:'#ccc',border:'1px solid #444',padding:'6px 14px',borderRadius:'4px',fontSize:'12px',cursor:'pointer',fontWeight:600}}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 20px',display:'flex',gap:'4px',overflowX:'auto'}}>
        {(['dashboard','motos','usuarios','publicidad','dealers','leads'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowBannerForm(false); setEditingBanner(null); }}
            style={{padding:'16px 20px',border:'none',background:'none',fontSize:'13px',fontWeight:700,cursor:'pointer',textTransform:'uppercase',color: tab === t ? '#E8390E' : '#888',borderBottom: tab === t ? '2px solid #E8390E' : '2px solid transparent',whiteSpace:'nowrap'}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{maxWidth:'1000px',margin:'24px auto',padding:'0 20px'}}>
        {tab === 'dashboard' && (
          <div>
            <h2 style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#1E2340',marginBottom:'20px'}}>Dashboard</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px'}}>
              {[
                {label:'Total usuarios', value: stats.totalUsuarios || 0, color:'#1E2340'},
                {label:'Motos activas', value: stats.motosActivas || 0, color:'#0F6E56'},
                {label:'Motos hoy', value: stats.motosHoy || 0, color:'#E8390E'},
                {label:'Total motos', value: stats.totalMotos || 0, color:'#4338CA'},
              ].map(s => (
                <div key={s.label} style={{background:'#fff',borderRadius:'8px',padding:'24px',border:'1px solid #e8e8e8',textAlign:'center'}}>
                  <div style={{fontFamily:'Poppins,sans-serif',fontSize:'36px',fontWeight:900,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:'12px',color:'#888',fontWeight:600,textTransform:'uppercase',marginTop:'4px'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'motos' && (
          <div>
            <h2 style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#1E2340',marginBottom:'20px'}}>Gestionar motos</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {motos.map(moto => {
                const fotos = (() => { try { return JSON.parse(moto.fotos || '[]') } catch { return [] } })()
                return (
                  <div key={moto.id} style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',display:'flex',overflow:'hidden'}}>
                    <div style={{width:'80px',height:'80px',flexShrink:0,background:'#e8e8e8'}}>
                      {fotos[0] ? (
                        <Image
                          src={fotos[0]}
                          alt={`${moto.marca} ${moto.modelo} ${moto.anio} - ${moto.ciudad}`}
                          width={80}
                          height={80}
                          sizes="80px"
                          style={{width:'80px',height:'80px',objectFit:'cover'}}
                        />
                      ) : <div style={{width:'80px',height:'80px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>🏍️</div>}
                    </div>
                    <div style={{padding:'12px 16px',flex:1,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340'}}>{moto.marca} {moto.modelo} — ${moto.precio?.toLocaleString()}</div>
                        <div style={{fontSize:'11px',color:'#888'}}>{moto.user?.name} · {moto.ciudad} · {moto.anio} · {moto.planTipo || 'gratis'}</div>
                        <span style={{background: moto.estado === 'activo' ? '#E1F5EE' : '#FCEBEB', color: moto.estado === 'activo' ? '#0F6E56' : '#A32D2D', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700}}>
                          {moto.estado}
                        </span>
                      </div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <Link href={'/motos/' + (moto.slug || moto.id)} target="_blank" style={{background:'#f4f4f4',color:'#333',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>Ver</Link>
                        {moto.estado === 'activo' ? (
                          <button onClick={() => handleMotoEstado(moto.id, 'suspendido')} style={{background:'#FFF8E1',color:'#B45309',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Suspender</button>
                        ) : (
                          <button onClick={() => handleMotoEstado(moto.id, 'activo')} style={{background:'#E1F5EE',color:'#0F6E56',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Activar</button>
                        )}
                        <button onClick={() => setHistorialMotoId(moto.id)} style={{background:'#EEF2FF',color:'#4338CA',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>📜 Historial</button>
                        <button onClick={() => handleEliminarMoto(moto.id)} style={{background:'#FCEBEB',color:'#A32D2D',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'usuarios' && (
          <div>
            <h2 style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#1E2340',marginBottom:'20px'}}>Gestionar usuarios</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {usuarios.map(user => (
                <div key={user.id} style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',padding:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#E8390E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:900,color:'white',flexShrink:0}}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340'}}>{user.name || 'Sin nombre'}</div>
                        <div style={{fontSize:'12px',color:'#888'}}>{user.email} · {user.ciudad || 'Sin ciudad'} · {user._count?.listings || 0} motos</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px',marginLeft:'46px'}}>
                      <span style={{background: user.role === 'admin' ? '#EEF2FF' : '#f4f4f4', color: user.role === 'admin' ? '#4338CA' : '#888', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700}}>{user.role}</span>
                      {user.blocked && <span style={{background:'#FCEBEB',color:'#A32D2D',padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:700}}>Bloqueado</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <Link href={`/admin/usuarios/${user.id}`} style={{background:'#EEF2FF',color:'#4338CA',border:'none',padding:'8px 14px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer',textDecoration:'none'}}>Ver detalle</Link>
                    {user.role !== 'admin' && (
                      <>
                        {user.blocked ? (
                          <button onClick={() => handleUsuarioBloqueo(user.id, false)} style={{background:'#E1F5EE',color:'#0F6E56',border:'none',padding:'8px 14px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Desbloquear</button>
                        ) : (
                          <button onClick={() => handleUsuarioBloqueo(user.id, true)} style={{background:'#FFF8E1',color:'#B45309',border:'none',padding:'8px 14px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Bloquear</button>
                        )}
                        <button onClick={() => handleEliminarUsuario(user.id)} style={{background:'#FCEBEB',color:'#A32D2D',border:'none',padding:'8px 14px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'publicidad' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontFamily:'Poppins,sans-serif',fontSize:'20px',fontWeight:900,color:'#1E2340',margin:0}}>Gestionar publicidad</h2>
              {!showBannerForm && (
                <button onClick={() => { setEditingBanner(null); setShowBannerForm(true); }}
                  style={{background:'#E8390E',color:'white',border:'none',padding:'10px 18px',borderRadius:'4px',fontSize:'12px',fontWeight:800,cursor:'pointer',textTransform:'uppercase'}}>
                  + Nuevo banner
                </button>
              )}
            </div>

            {showBannerForm ? (
              <BannerForm
                initial={editingBanner}
                onCancel={() => { setShowBannerForm(false); setEditingBanner(null); }}
                onSaved={() => { setShowBannerForm(false); setEditingBanner(null); loadBanners(); }}
              />
            ) : (
              <BannerList
                banners={banners}
                onEdit={(b: any) => { setEditingBanner(b); setShowBannerForm(true); }}
                onDelete={handleEliminarBanner}
                onToggleActive={handleToggleActive}
              />
            )}
          </div>
        )}

        {tab === 'dealers' && (
          <div style={{padding:'20px'}}>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {(['pending_approval','approved','rejected','todos'] as const).map(s => (
                <button key={s} onClick={() => setDealerFilter(s)} style={{
                  padding:'8px 14px',
                  background: dealerFilter === s ? '#1E2340' : '#fff',
                  color: dealerFilter === s ? '#fff' : '#1E2340',
                  border:'1px solid #1E2340', borderRadius:4,
                  fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase',
                }}>
                  {s === 'pending_approval' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : s === 'rejected' ? 'Rechazados' : 'Todos'}
                </button>
              ))}
            </div>
            {dealers.length === 0 ? (
              <div style={{padding:40, textAlign:'center', color:'#888', background:'#fafafa', border:'1px dashed #d0d0d0', borderRadius:6}}>
                Sin concesionarios en este estado.
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:14}}>
                {dealers.map((d: any) => (
                  <div key={d.id} style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:6,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,padding:14,borderBottom:'1px solid #f0f0f0'}}>
                      {d.logo ? <img src={d.logo} alt="" style={{width:48,height:48,borderRadius:6,objectFit:'cover'}} /> : <div style={{width:48,height:48,background:'#1E2340',color:'#fff',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800}}>{d.nombreComercial.charAt(0)}</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:800,color:'#1E2340',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.nombreComercial}</div>
                        <div style={{fontSize:11,color:'#888'}}>{d.ciudad}, {d.provincia}</div>
                      </div>
                      <span style={{
                        fontSize:10, padding:'3px 8px', borderRadius:999, fontWeight:800,
                        background: d.approvalStatus === 'approved' ? '#D1FAE5' : d.approvalStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                        color: d.approvalStatus === 'approved' ? '#065F46' : d.approvalStatus === 'rejected' ? '#7F1D1D' : '#78350F',
                      }}>
                        {d.approvalStatus === 'pending_approval' ? 'PENDIENTE' : d.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                    <div style={{padding:'12px 14px',fontSize:12,color:'#444',display:'grid',gap:4}}>
                      <div><strong>RUC:</strong> {d.ruc || '—'}</div>
                      <div><strong>Razón social:</strong> {d.razonSocial || '—'}</div>
                      <div><strong>Email cuenta:</strong> {d.user?.email || '—'}</div>
                      <div><strong>Anuncios cargados:</strong> {d._count?.listings ?? 0}</div>
                      <div><strong>Registrado:</strong> {formatFechaCorta(d.createdAt)}</div>
                      {d.verifications?.[0]?.documentUrl && (
                        <div>
                          <strong>Documento:</strong>{' '}
                          <a
                            href={d.verifications[0].documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              // Forzamos pestaña nueva via window.open para evitar
                              // que el navegador abra PDFs inline en la misma pestaña.
                              e.preventDefault()
                              window.open(d.verifications[0].documentUrl, '_blank', 'noopener,noreferrer')
                            }}
                            style={{color:'#E8390E',fontWeight:700,cursor:'pointer'}}
                          >Ver archivo en pestaña nueva ↗</a>
                        </div>
                      )}
                      <div>
                        <strong>Perfil:</strong>{' '}
                        <a href={'/dealers/' + d.slug} target="_blank" rel="noopener noreferrer" style={{color:'#1E2340'}}>/dealers/{d.slug}</a>
                      </div>
                      {d.rejectionNotes && (
                        <div style={{background:'#FEE2E2',padding:'6px 8px',borderRadius:4,marginTop:6}}>
                          <strong>Nota rechazo:</strong> {d.rejectionNotes}
                        </div>
                      )}
                      {d.applications?.[0] && (
                        <div style={{background:'#FFF5F0',border:'1px solid #FFD2BD',padding:'8px 10px',borderRadius:4,marginTop:8}}>
                          <div style={{fontSize:11,fontWeight:800,color:'#E8390E',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>
                            📋 Llegó desde el formulario público
                          </div>
                          <div style={{fontSize:12,color:'#444',lineHeight:1.6}}>
                            <div><strong>Negocio:</strong> {d.applications[0].businessName}</div>
                            <div><strong>Stock declarado:</strong> {d.applications[0].stockRange}</div>
                            {d.applications[0].message && (
                              <div><strong>Mensaje:</strong> {d.applications[0].message}</div>
                            )}
                            <div><strong>Fecha solicitud:</strong> {formatFechaCorta(d.applications[0].createdAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {d.approvalStatus === 'pending_approval' && (
                      <div style={{padding:'10px 14px',display:'flex',gap:8,borderTop:'1px solid #f0f0f0'}}>
                        <button onClick={() => handleDealerApprove(d.id)} style={{flex:1,background:'#10B981',color:'#fff',border:'none',padding:'10px',borderRadius:4,fontSize:12,fontWeight:800,cursor:'pointer',textTransform:'uppercase'}}>Aprobar</button>
                        <button onClick={() => handleDealerReject(d.id)} style={{flex:1,background:'#E8390E',color:'#fff',border:'none',padding:'10px',borderRadius:4,fontSize:12,fontWeight:800,cursor:'pointer',textTransform:'uppercase'}}>Rechazar</button>
                      </div>
                    )}
                    {d.approvalStatus === 'approved' && (
                      <div style={{padding:'10px 14px',borderTop:'1px solid #f0f0f0',display:'flex',gap:6}}>
                        <button onClick={() => setActividadDealer({ id: d.id, name: d.nombreComercial })} style={{flex:1,background:'#EEF2FF',color:'#4338CA',border:'none',padding:'8px',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>📜 Actividad</button>
                        <button onClick={() => handleDealerReject(d.id)} style={{flex:1,background:'#fff',color:'#E8390E',border:'1px solid #E8390E',padding:'8px',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>Rechazar</button>
                      </div>
                    )}
                    {d.approvalStatus === 'rejected' && (
                      <div style={{padding:'10px 14px',borderTop:'1px solid #f0f0f0'}}>
                        <button onClick={() => handleDealerApprove(d.id)} style={{width:'100%',background:'#fff',color:'#10B981',border:'1px solid #10B981',padding:'8px',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>Re-aprobar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'leads' && (
          <div style={{padding:'20px'}}>
            <div style={{ marginBottom: 12 }}>
              <LeadsDateFilter />
            </div>
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              <label style={{fontSize:12,fontWeight:700,color:'#1E2340'}}>
                Tipo:&nbsp;
                <select value={leadsFilter.tipo} onChange={e => setLeadsFilter(f => ({ ...f, tipo: e.target.value as any }))} style={{padding:'6px 10px',border:'1px solid #d0d0d0',borderRadius:4,fontSize:12}}>
                  <option value="todos">Todos</option>
                  <option value="dealer">Solo dealer</option>
                  <option value="user">Solo particular</option>
                </select>
              </label>
              <label style={{fontSize:12,fontWeight:700,color:'#1E2340'}}>
                Financiamiento:&nbsp;
                <select value={leadsFilter.financiamiento} onChange={e => setLeadsFilter(f => ({ ...f, financiamiento: e.target.value as any }))} style={{padding:'6px 10px',border:'1px solid #d0d0d0',borderRadius:4,fontSize:12}}>
                  <option value="todos">Todos</option>
                  <option value="si">Solo con financiamiento</option>
                  <option value="no">Sin financiamiento</option>
                </select>
              </label>
              {(() => {
                const qs = new URLSearchParams()
                qs.set('tipo', leadsFilter.tipo)
                qs.set('financiamiento', leadsFilter.financiamiento)
                const d = sp.get('desde'); const h = sp.get('hasta')
                if (d) qs.set('desde', d)
                if (h) qs.set('hasta', h)
                return (
                  <a href={'/api/admin/leads/export?' + qs.toString()}
                    style={{marginLeft:'auto',background:'#1E2340',color:'#fff',padding:'8px 14px',fontSize:12,fontWeight:700,textTransform:'uppercase',textDecoration:'none',borderRadius:4}}>
                    Exportar CSV
                  </a>
                )
              })()}
            </div>
            {leadsAdmin.length === 0 ? (
              <div style={{padding:40, textAlign:'center', color:'#888', background:'#fafafa', border:'1px dashed #d0d0d0', borderRadius:6}}>
                Sin leads para los filtros elegidos.
              </div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'#fafafa'}}>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Fecha</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Tipo</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Nombre</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Tel.</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Ciudad</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Moto</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,textTransform:'uppercase',color:'#666'}}>Financ.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsAdmin.map((l: any) => (
                      <tr key={l.id} style={{borderTop:'1px solid #ececec'}}>
                        <td style={{padding:'8px 12px'}}>{new Date(l.createdAt).toLocaleString('es-EC')}</td>
                        <td style={{padding:'8px 12px'}}>{l.listingOwnerType === 'dealer' ? '🏪 Dealer' : '👤 Particular'}</td>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{l.nombre}</td>
                        <td style={{padding:'8px 12px'}}>{l.telefono}</td>
                        <td style={{padding:'8px 12px'}}>{l.ciudad ?? '—'}</td>
                        <td style={{padding:'8px 12px'}}>{l.listing ? `${l.listing.marca} ${l.listing.modelo}` : '—'}</td>
                        <td style={{padding:'8px 12px'}}>{l.interesadoFinanciamiento ? 'Sí' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {historialMotoId && (
        <ListingHistorialModal
          listingId={historialMotoId}
          endpointBase="/api/admin/motos"
          onClose={() => setHistorialMotoId(null)}
        />
      )}

      {actividadDealer && (
        <DealerActivityModal
          dealerId={actividadDealer.id}
          dealerName={actividadDealer.name}
          onClose={() => setActividadDealer(null)}
        />
      )}
    </div>
  )
}


// ==========================
// Componente: Lista de banners
// ==========================
function BannerList({ banners, onEdit, onDelete, onToggleActive }: any) {
  const [pageFilter, setPageFilter] = useState<'todas' | 'home' | 'motos' | 'dealers'>('todas')

  if (banners.length === 0) {
    return <div style={{background:'#fff',borderRadius:'8px',padding:'40px',textAlign:'center',color:'#888'}}>No hay banners aún. Crea el primero.</div>
  }

  const positionLabels: any = {
    hero: 'Home · Hero',
    mid_left: 'Home · Mid izquierdo',
    mid_right: 'Home · Mid derecho',
    motos_hero: 'Motos · Hero',
    motos_mid_left: 'Motos · Mid izquierdo',
    motos_mid_right: 'Motos · Mid derecho',
    dealers_hero: 'Dealers · Hero',
    dealers_mid_left: 'Dealers · Mid izquierdo',
    dealers_mid_right: 'Dealers · Mid derecho',
  }
  const positionPage = (p: string) => {
    if (p === 'hero' || p === 'mid_left' || p === 'mid_right') return 'home'
    if (p.startsWith('motos_')) return 'motos'
    if (p.startsWith('dealers_')) return 'dealers'
    return 'home'
  }
  const filtered = pageFilter === 'todas'
    ? banners
    : banners.filter((b: any) => positionPage(b.position) === pageFilter)
  const now = new Date()

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:6}}>
        <span style={{fontSize:11,fontWeight:700,color:'#666',textTransform:'uppercase',alignSelf:'center'}}>Filtrar por página:</span>
        {(['todas','home','motos','dealers'] as const).map(p => (
          <button key={p} onClick={() => setPageFilter(p)} style={{
            padding:'6px 12px',
            background: pageFilter === p ? '#1E2340' : '#fff',
            color: pageFilter === p ? '#fff' : '#1E2340',
            border:'1px solid #1E2340', borderRadius:4,
            fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase',
          }}>{p}</button>
        ))}
        <span style={{fontSize:11,color:'#888',alignSelf:'center',marginLeft:6}}>
          {filtered.length} de {banners.length}
        </span>
      </div>
      {filtered.length === 0 && (
        <div style={{background:'#fafafa',border:'1px dashed #d0d0d0',borderRadius:6,padding:'24px',textAlign:'center',color:'#888'}}>
          Ningún banner coincide con el filtro.
        </div>
      )}
      {filtered.map((b: any) => {
        const imp = b._count?.impressions || 0
        const clk = b._count?.clicks || 0
        const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00'
        const start = new Date(b.startDate)
        const end = new Date(b.endDate)
        const vigente = b.active && start <= now && now <= end

        return (
          <div key={b.id} style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',display:'flex',overflow:'hidden'}}>
            <div style={{width:'120px',height:'80px',flexShrink:0,background:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {b.imageUrl ? (
                <Image
                  src={b.imageUrl}
                  alt={b.title || 'Banner publicitario'}
                  width={120}
                  height={80}
                  sizes="120px"
                  style={{width:'120px',height:'80px',objectFit:'cover'}}
                />
              ) : '🖼️'}
            </div>
            <div style={{padding:'12px 16px',flex:1,display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340'}}>{b.title}</div>
                <div style={{fontSize:'11px',color:'#888'}}>
                  {b.advertiser || 'Sin anunciante'} · {positionLabels[b.position] || b.position} · {formatFechaCorta(start)} → {formatFechaCorta(end)}
                </div>
                <div style={{display:'flex',gap:'6px',marginTop:'4px',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{background: vigente ? '#E1F5EE' : '#FCEBEB', color: vigente ? '#0F6E56' : '#A32D2D', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700}}>
                    {vigente ? 'Vigente' : b.active ? (start > now ? 'Programado' : 'Expirado') : 'Pausado'}
                  </span>
                  <span style={{fontSize:'11px',color:'#666'}}>👁 {imp.toLocaleString()}</span>
                  <span style={{fontSize:'11px',color:'#666'}}>🖱 {clk.toLocaleString()}</span>
                  <span style={{fontSize:'11px',color:'#666'}}>CTR: {ctr}%</span>
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',justifyContent:'flex-end'}}>
                {b.active ? (
                  <button onClick={() => onToggleActive(b.id, false)} style={{background:'#FFF8E1',color:'#B45309',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Pausar</button>
                ) : (
                  <button onClick={() => onToggleActive(b.id, true)} style={{background:'#E1F5EE',color:'#0F6E56',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Activar</button>
                )}
                <button onClick={() => onEdit(b)} style={{background:'#EEF2FF',color:'#4338CA',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Editar</button>
                <button onClick={() => onDelete(b.id)} style={{background:'#FCEBEB',color:'#A32D2D',border:'none',padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>Eliminar</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ==========================
// Componente: Formulario de banner
// ==========================
function BannerForm({ initial, onCancel, onSaved }: any) {
  const toDateInput = (d: any) => d ? new Date(d).toISOString().slice(0,10) : ''

  const [title, setTitle] = useState(initial?.title || '')
  const [advertiser, setAdvertiser] = useState(initial?.advertiser || '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '')
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || '')
  const [position, setPosition] = useState(initial?.position || 'hero')
  const [startDate, setStartDate] = useState(initial?.startDate ? toDateInput(initial.startDate) : toDateInput(new Date()))
  const [endDate, setEndDate] = useState(initial?.endDate ? toDateInput(initial.endDate) : toDateInput(new Date(Date.now()+30*24*60*60*1000)))
  const [active, setActive] = useState(initial?.active !== false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/banners/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.error) { alert('Error: ' + data.error); return }
    setImageUrl(data.url)
  }

  const handleSubmit = async () => {
    if (!title || !imageUrl || !position || !startDate || !endDate) {
      alert('Completa los campos obligatorios (título, imagen, posición, fechas)')
      return
    }
    setSaving(true)
    const payload = { title, advertiser, imageUrl, linkUrl, position, startDate, endDate, active }
    const res = initial
      ? await fetch('/api/admin/banners/' + initial.id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      : await fetch('/api/admin/banners', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (data.error) { alert('Error: ' + data.error); return }
    onSaved()
  }

  const labelStyle: React.CSSProperties = { fontSize:'12px',fontWeight:700,color:'#1E2340',marginBottom:'4px',display:'block',textTransform:'uppercase' }
  const inputStyle: React.CSSProperties = { width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',fontFamily:'inherit',boxSizing:'border-box' }

  return (
    <div style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',padding:'24px'}}>
      <h3 style={{fontFamily:'Poppins,sans-serif',fontSize:'16px',fontWeight:900,color:'#1E2340',marginTop:0,marginBottom:'20px'}}>
        {initial ? 'Editar banner' : 'Nuevo banner'}
      </h3>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
        <div style={{gridColumn:'1 / span 2'}}>
          <label style={labelStyle}>Título interno *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Yamaha Mayo 2026" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Anunciante</label>
          <input type="text" value={advertiser} onChange={e => setAdvertiser(e.target.value)} placeholder="Ej: Yamaha Ecuador" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Posición *</label>
          <select value={position} onChange={e => setPosition(e.target.value)} style={inputStyle}>
            <optgroup label="Home">
              <option value="hero">Hero (arriba, 4:1)</option>
              <option value="mid_left">Mid izquierdo (4:1)</option>
              <option value="mid_right">Mid derecho (4:1)</option>
            </optgroup>
            <optgroup label="Motos (/motos)">
              <option value="motos_hero">Hero (arriba, 4:1)</option>
              <option value="motos_mid_left">Mid izquierdo (4:1)</option>
              <option value="motos_mid_right">Mid derecho (4:1)</option>
            </optgroup>
            <optgroup label="Dealers (/dealers)">
              <option value="dealers_hero">Hero (arriba, 4:1)</option>
              <option value="dealers_mid_left">Mid izquierdo (4:1)</option>
              <option value="dealers_mid_right">Mid derecho (4:1)</option>
            </optgroup>
          </select>
        </div>

        <div style={{gridColumn:'1 / span 2'}}>
          <label style={labelStyle}>Imagen *</label>
          {imageUrl && (
            <div style={{marginBottom:'8px'}}>
              <Image
                src={imageUrl}
                alt="Vista previa del banner"
                width={1200}
                height={300}
                sizes="(max-width: 900px) 100vw, 900px"
                style={{maxWidth:'100%',height:'auto',maxHeight:'180px',width:'auto',borderRadius:'4px',border:'1px solid #e0e0e0'}}
              />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{fontSize:'13px'}} />
          {uploading && <span style={{fontSize:'12px',color:'#E8390E',marginLeft:'10px'}}>Subiendo...</span>}
          <div style={{fontSize:'11px',color:'#888',marginTop:'4px'}}>Máx. 3 MB. Formato recomendado: 4:1 (ej. 1200x300)</div>
        </div>

        <div style={{gridColumn:'1 / span 2'}}>
          <label style={labelStyle}>URL de destino (al hacer click)</label>
          <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Fecha inicio *</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Fecha fin *</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={{gridColumn:'1 / span 2',display:'flex',alignItems:'center',gap:'8px'}}>
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} id="active-check" style={{width:'18px',height:'18px'}} />
          <label htmlFor="active-check" style={{fontSize:'13px',fontWeight:600,color:'#1E2340',cursor:'pointer'}}>Banner activo (se muestra en el sitio)</label>
        </div>
      </div>

      <div style={{display:'flex',gap:'8px',marginTop:'24px',justifyContent:'flex-end'}}>
        <button onClick={onCancel} disabled={saving} style={{background:'#f4f4f4',color:'#333',border:'none',padding:'10px 18px',borderRadius:'4px',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Cancelar</button>
        <button onClick={handleSubmit} disabled={saving || uploading} style={{background:'#E8390E',color:'white',border:'none',padding:'10px 22px',borderRadius:'4px',fontSize:'13px',fontWeight:800,cursor:'pointer',textTransform:'uppercase',opacity: saving||uploading ? 0.6 : 1}}>
          {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear banner'}
        </button>
      </div>
    </div>
  )
}
