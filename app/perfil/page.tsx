'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProvincias, getCiudadesByProvincia } from '@/lib/provincias-ecuador'
import { formatFechaLarga } from '@/lib/format-date'

type Tab = 'personal' | 'seguridad' | 'pagos' | 'eliminar'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('personal')
  const [loaded, setLoaded] = useState(false)

  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [avatar, setAvatar] = useState('')
  const [email, setEmail] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{type:'ok'|'err',text:string}|null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    // Sin sesión: empuja a login pasando ?next=/perfil para que post-login
    // vuelva aquí en lugar de caer al fallback por rol (home/mi-tienda).
    if (status === 'unauthenticated') router.push('/auth/login?next=/perfil')
    // Los dealers no tienen perfil personal — su gestión vive en /mi-tienda/perfil.
    if (status === 'authenticated' && (session?.user as any)?.role === 'dealer') {
      router.replace('/mi-tienda/perfil')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.email && !loaded) {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setName(data.user.name || '')
            setLastName(data.user.lastName || '')
            setPhone(data.user.phone || '')
            setProvincia(data.user.provincia || '')
            setCiudad(data.user.ciudad || '')
            setBio(data.user.bio || '')
            setGender(data.user.gender || '')
            setBirthDate(data.user.birthDate ? data.user.birthDate.split('T')[0] : '')
            setAvatar(data.user.avatar || '')
            setEmail(data.user.email || '')
            setHasPassword(!!data.user.hasPassword)
            setPhoneVerified(!!data.user.phoneVerified)
            setLoaded(true)
          }
        })
    }
  }, [session, loaded])

  useEffect(() => {
    if (tab === 'pagos' && payments.length === 0 && !loadingPayments) {
      setLoadingPayments(true)
      fetch('/api/user/payments')
        .then(r => r.json())
        .then(data => {
          setPayments(data.payments || [])
          setLoadingPayments(false)
        })
    }
  }, [tab])

  const showMsg = (type: 'ok'|'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const handleSavePersonal = async () => {
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, lastName, phone, ciudad, provincia, bio, gender, birthDate, avatar }),
    })
    if (res.ok) showMsg('ok', 'Perfil actualizado correctamente')
    else showMsg('err', 'Error al guardar los cambios')
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      showMsg('err', 'La foto supera los 10MB. Reduce el tamaño e intenta de nuevo.')
      input.value = ''
      return
    }
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'HTTP ' + res.status)
      }
      const data = await res.json().catch(() => ({}))
      if (!data.url) throw new Error('Respuesta sin URL')
      setAvatar(data.url)
      const saveRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ avatar: data.url }),
      })
      if (!saveRes.ok) throw new Error('No se pudo guardar el perfil')
      showMsg('ok', 'Foto actualizada')
    } catch (err: any) {
      console.error('Avatar upload failed', err)
      showMsg('err', 'Error al subir la foto. Intenta de nuevo.')
    } finally {
      setUploadingAvatar(false)
      input.value = ''
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { showMsg('err', 'Las contraseñas no coinciden'); return }
    if (newPassword.length < 8) { showMsg('err', 'La nueva contraseña debe tener al menos 8 caracteres'); return }
    setSaving(true)
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      showMsg('ok', 'Contraseña actualizada correctamente')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } else {
      showMsg('err', data.error || 'Error al cambiar contraseña')
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'ELIMINAR') return
    setDeleting(true)
    const res = await fetch('/api/user/delete-account', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ confirmText: deleteText }),
    })
    if (res.ok) {
      alert('Cuenta eliminada. Serás redirigido al inicio.')
      await signOut({ callbackUrl: '/' })
    } else {
      const data = await res.json()
      showMsg('err', data.error || 'Error al eliminar cuenta')
      setDeleting(false)
    }
  }

  if (status === 'loading' || !loaded) return <div style={{padding:'40px',textAlign:'center'}}>Cargando...</div>

  const initials = ((name?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'U'
  const displayName = [name, lastName].filter(Boolean).join(' ') || session?.user?.name || 'Usuario'

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 16px', fontSize: '13px', fontWeight: 700,
    color: active ? '#E8390E' : '#666',
    borderBottom: active ? '2px solid #E8390E' : '2px solid transparent',
    background: 'none', cursor: 'pointer',
    fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase',
    letterSpacing: '0.5px', flex: 1, borderTop:'none', borderLeft:'none', borderRight:'none'
  })

  const labelStyle: React.CSSProperties = {fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}
  const inputStyle: React.CSSProperties = {width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none',fontFamily:'inherit'}
  const primaryBtn: React.CSSProperties = {width:'100%',padding:'12px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer',textTransform:'uppercase',fontFamily:'Montserrat,sans-serif',letterSpacing:'0.5px'}

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{maxWidth:'720px',margin:'32px auto',padding:'0 20px'}}>

        <div style={{background:'#fff',borderRadius:'8px',padding:'24px 32px',border:'1px solid #e8e8e8',marginBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{width:'64px',height:'64px',borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
            ) : (
              <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#E8390E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:900,color:'white',flexShrink:0}}>
                {initials}
              </div>
            )}
            <div style={{flex:1,minWidth:'200px'}}>
              <div style={{fontSize:'18px',fontWeight:700,color:'#1E2340'}}>{displayName}</div>
              <div style={{fontSize:'13px',color:'#888'}}>{email}</div>
            </div>
            <Link href="/mis-motos" style={{background:'#1E2340',color:'white',padding:'10px 16px',borderRadius:'4px',fontSize:'12px',fontWeight:800,textDecoration:'none',textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:'Montserrat,sans-serif'}}>Mis motos</Link>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:'1px solid #e8e8e8',flexWrap:'wrap'}}>
            <button onClick={()=>setTab('personal')} style={tabStyle(tab==='personal')}>Personal</button>
            <button onClick={()=>setTab('seguridad')} style={tabStyle(tab==='seguridad')}>Seguridad</button>
            <button onClick={()=>setTab('pagos')} style={tabStyle(tab==='pagos')}>Pagos</button>
            <button onClick={()=>setTab('eliminar')} style={tabStyle(tab==='eliminar')}>Eliminar</button>
          </div>

          <div style={{padding:'32px'}}>
            {msg && <div style={{background: msg.type==='ok'?'#E1F5EE':'#FCEBEB', color: msg.type==='ok'?'#0F6E56':'#A32D2D', padding:'10px 12px', borderRadius:'4px', fontSize:'13px', marginBottom:'20px', fontWeight:600}}>{msg.text}</div>}

            {tab === 'personal' && (
              <div>
                <div style={{marginBottom:'20px',padding:'16px',background:'#f9f9f9',borderRadius:'4px'}}>
                  <div style={{...labelStyle,marginBottom:'10px'}}>Foto de perfil</div>
                  <label style={{display:'inline-block',padding:'8px 14px',background:'#1E2340',color:'white',borderRadius:'4px',fontSize:'12px',fontWeight:700,cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                    {uploadingAvatar ? 'Subiendo...' : (avatar ? 'Cambiar foto' : 'Subir foto')}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:'none'}} disabled={uploadingAvatar} />
                  </label>
                  <div style={{fontSize:'11px',color:'#999',marginTop:'8px'}}>JPG o PNG. Máx 5MB.</div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Apellido</label>
                    <input value={lastName} onChange={e=>setLastName(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Email</label>
                  <input value={email} disabled style={{...inputStyle,background:'#f4f4f4',color:'#888',cursor:'not-allowed'}} />
                  <div style={{fontSize:'11px',color:'#999',marginTop:'4px'}}>El email no se puede cambiar</div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>
                    Celular {phoneVerified && <span style={{color:'#0F6E56',fontWeight:700,marginLeft:'6px'}}>✓ Verificado</span>}
                  </label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} placeholder="+593 99 000 0000" />
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                  <div>
                    <label style={labelStyle}>Género</label>
                    <select value={gender} onChange={e=>setGender(e.target.value)} style={inputStyle}>
                      <option value="">Prefiero no decirlo</option>
                      <option value="hombre">Hombre</option>
                      <option value="mujer">Mujer</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha de nacimiento</label>
                    <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Provincia</label>
                  <select value={provincia} onChange={e=>{ setProvincia(e.target.value); setCiudad('') }} style={inputStyle}>
                    <option value="">Selecciona tu provincia</option>
                    {getProvincias().map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Ciudad</label>
                  <select value={ciudad} onChange={e=>setCiudad(e.target.value)} disabled={!provincia}
                    style={{...inputStyle, background: provincia ? '#fff' : '#f5f5f5'}}>
                    <option value="">{provincia ? 'Selecciona tu ciudad' : 'Selecciona provincia primero'}</option>
                    {provincia && getCiudadesByProvincia(provincia).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{marginBottom:'24px'}}>
                  <label style={labelStyle}>Bio</label>
                  <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} style={{...inputStyle,resize:'vertical'}} placeholder="Cuéntanos algo sobre ti..." />
                </div>

                <button onClick={handleSavePersonal} disabled={saving} style={primaryBtn}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}

            {tab === 'seguridad' && (
              <div>
                {!hasPassword ? (
                  <div style={{padding:'16px',background:'#FFF7E6',border:'1px solid #FFD591',borderRadius:'4px',fontSize:'13px',color:'#8B5A00'}}>
                    <strong>Tu cuenta usa Google</strong>
                    <p style={{marginTop:'8px',marginBottom:0}}>La contraseña se gestiona desde tu cuenta de Google. Para cambiarla, hazlo directamente en tu configuración de Google.</p>
                  </div>
                ) : (
                  <>
                    <PasswordField
                      label="Contraseña actual"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      inputStyle={inputStyle}
                      labelStyle={labelStyle}
                    />
                    <PasswordField
                      label="Nueva contraseña"
                      value={newPassword}
                      onChange={setNewPassword}
                      inputStyle={inputStyle}
                      labelStyle={labelStyle}
                      hint={
                        newPassword.length === 0 ? 'Mínimo 8 caracteres' :
                        newPassword.length < 8 ? '✗ Muy corta (mínimo 8 caracteres)' :
                        currentPassword && newPassword === currentPassword ? '✗ Debe ser distinta a la actual' :
                        '✓ Longitud válida'
                      }
                      hintColor={
                        newPassword.length === 0 ? '#999' :
                        newPassword.length < 8 ? '#A32D2D' :
                        currentPassword && newPassword === currentPassword ? '#A32D2D' :
                        '#0F6E56'
                      }
                    />
                    <PasswordField
                      label="Confirmar nueva contraseña"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      inputStyle={inputStyle}
                      labelStyle={labelStyle}
                      hint={
                        confirmPassword.length === 0 ? '' :
                        confirmPassword === newPassword ? '✓ Las contraseñas coinciden' :
                        '✗ Las contraseñas no coinciden'
                      }
                      hintColor={
                        confirmPassword === newPassword ? '#0F6E56' : '#A32D2D'
                      }
                    />
                    {(() => {
                      const isValid = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && newPassword !== currentPassword
                      return (
                        <button onClick={handleChangePassword} disabled={saving || !isValid}
                          style={{...primaryBtn, background: isValid ? '#E8390E' : '#ccc', cursor: isValid ? 'pointer' : 'not-allowed', marginTop: '8px'}}>
                          {saving ? 'Actualizando...' : 'Cambiar contraseña'}
                        </button>
                      )
                    })()}
                  </>
                )}
              </div>
            )}

            {tab === 'pagos' && (
              <div>
                {loadingPayments ? (
                  <div style={{textAlign:'center',padding:'40px',color:'#888'}}>Cargando...</div>
                ) : payments.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px',color:'#888'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px'}}>💳</div>
                    <div style={{fontSize:'14px',fontWeight:600,color:'#333'}}>Aún no tienes pagos registrados</div>
                    <div style={{fontSize:'13px',marginTop:'6px'}}>Cuando publiques con un plan de pago, aparecerá aquí.</div>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    {payments.map((p: any) => (
                      <div key={p.id} style={{border:'1px solid #e8e8e8',borderRadius:'4px',padding:'14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px',flexWrap:'wrap',gap:'8px'}}>
                          <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340',textTransform:'capitalize'}}>Plan {p.tipo}</div>
                          <div style={{fontSize:'14px',fontWeight:800,color:'#E8390E'}}>${p.precio?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div style={{fontSize:'12px',color:'#888',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
                          <span>{formatFechaLarga(p.createdAt)}</span>
                          <span style={{textTransform:'uppercase',fontWeight:700,color: p.estado==='pagado'?'#0F6E56': p.estado==='pendiente'?'#8B5A00':'#A32D2D'}}>{p.estado}</span>
                        </div>
                        {p.listings && p.listings.length > 0 && (
                          <div style={{marginTop:'8px',fontSize:'12px',color:'#555'}}>
                            {p.listings.map((l: any) => (
                              <Link key={l.id} href={`/motos/${l.slug || l.id}`} style={{color:'#1E2340',textDecoration:'none',fontWeight:600}}>
                                {l.marca} {l.modelo} {l.anio}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'eliminar' && (
              <div>
                <div style={{padding:'16px',background:'#FCEBEB',border:'1px solid #F5A8A8',borderRadius:'4px',fontSize:'13px',color:'#A32D2D',marginBottom:'20px'}}>
                  <strong style={{fontSize:'14px'}}>⚠️ Eliminar cuenta es permanente</strong>
                  <ul style={{marginTop:'10px',marginBottom:0,paddingLeft:'20px',lineHeight:'1.7'}}>
                    <li>Se eliminarán todas tus motos publicadas</li>
                    <li>Se eliminará tu historial de pagos</li>
                    <li>Se eliminará tu perfil y datos personales</li>
                    <li>Esta acción no se puede deshacer</li>
                  </ul>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Para confirmar, escribe <strong>ELIMINAR</strong> en el campo:</label>
                  <input value={deleteText} onChange={e=>setDeleteText(e.target.value)} style={inputStyle} placeholder="ELIMINAR" />
                </div>

                <button onClick={handleDeleteAccount} disabled={deleteText !== 'ELIMINAR' || deleting}
                  style={{...primaryBtn, background: deleteText === 'ELIMINAR' ? '#A32D2D' : '#ccc', cursor: deleteText === 'ELIMINAR' ? 'pointer' : 'not-allowed'}}>
                  {deleting ? 'Eliminando...' : 'Eliminar mi cuenta permanentemente'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, inputStyle, labelStyle, hint, hintColor }: {
  label: string
  value: string
  onChange: (v: string) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  hint?: string
  hintColor?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{marginBottom:'16px'}}>
      <label style={labelStyle}>{label}</label>
      <div style={{position:'relative'}}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{...inputStyle, paddingRight: '44px'}}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'16px',padding:'4px 8px',color:'#666'}}
          aria-label={show ? 'Ocultar' : 'Mostrar'}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {hint && <div style={{fontSize:'11px',color:hintColor||'#999',marginTop:'4px',fontWeight:600}}>{hint}</div>}
    </div>
  )
}
