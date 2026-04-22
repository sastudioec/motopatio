'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Tab = 'dashboard' | 'motos' | 'usuarios' | 'publicidad'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [motos, setMotos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // Estado del formulario de banners
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [showBannerForm, setShowBannerForm] = useState(false)

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
  }, [tab])

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

      <div style={{background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 20px',display:'flex',gap:'4px'}}>
        {(['dashboard','motos','usuarios','publicidad'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowBannerForm(false); setEditingBanner(null); }}
            style={{padding:'16px 20px',border:'none',background:'none',fontSize:'13px',fontWeight:700,cursor:'pointer',textTransform:'uppercase',color: tab === t ? '#E8390E' : '#888',borderBottom: tab === t ? '2px solid #E8390E' : '2px solid transparent'}}>
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
                        <div style={{fontSize:'12px',color:'#888'}}>{user.email} · {user.city || 'Sin ciudad'} · {user._count?.listings || 0} motos</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px',marginLeft:'46px'}}>
                      <span style={{background: user.role === 'admin' ? '#EEF2FF' : '#f4f4f4', color: user.role === 'admin' ? '#4338CA' : '#888', padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700}}>{user.role}</span>
                      {user.blocked && <span style={{background:'#FCEBEB',color:'#A32D2D',padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:700}}>Bloqueado</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
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
      </div>
    </div>
  )
}

// ==========================
// Componente: Lista de banners
// ==========================
function BannerList({ banners, onEdit, onDelete, onToggleActive }: any) {
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
  }
  const now = new Date()

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      {banners.map((b: any) => {
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
                  {b.advertiser || 'Sin anunciante'} · {positionLabels[b.position] || b.position} · {start.toLocaleDateString()} → {end.toLocaleDateString()}
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
