'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegistroPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, email, password, city}),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
      setLoading(false)
    } else {
      await signIn('credentials', {email, password, callbackUrl:'/'})
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatío" width={180} height={40} style={{height:'40px',width:'auto',marginBottom:'8px'}} />
          </Link>
          <p style={{fontSize:'14px',color:'#666',marginTop:'8px'}}>Crea tu cuenta gratis</p>
        </div>

        <button onClick={() => signIn('google', {callbackUrl:'/'})}
          style={{width:'100%',padding:'12px',border:'1px solid #e0e0e0',borderRadius:'4px',background:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'20px'}}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
          <div style={{flex:1,height:'1px',background:'#e0e0e0'}}></div>
          <span style={{fontSize:'12px',color:'#999'}}>o con email</span>
          <div style={{flex:1,height:'1px',background:'#e0e0e0'}}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Nombre completo</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px'}}
              placeholder="Juan Morocho" />
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px'}}
              placeholder="tu@email.com" />
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Ciudad</label>
            <select value={city} onChange={e=>setCity(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px'}}>
              <option value="">Selecciona tu ciudad</option>
              <option>Quito</option><option>Guayaquil</option><option>Cuenca</option>
              <option>Ambato</option><option>Loja</option><option>Ibarra</option>
              <option>Santo Domingo</option><option>Manta</option><option>Riobamba</option><option>Otra</option>
            </select>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px'}}
              placeholder="Mínimo 8 caracteres" />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Confirmar contraseña</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border: confirmPassword && password !== confirmPassword ? '1px solid #E8390E' : '1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px'}}
              placeholder="Repite tu contraseña" />
            {confirmPassword && password !== confirmPassword && (
              <div style={{fontSize:'11px',color:'#E8390E',marginTop:'4px'}}>Las contraseñas no coinciden</div>
            )}
          </div>
          <div style={{marginBottom:'16px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
            <input type="checkbox" required style={{marginTop:'3px',flexShrink:0}} />
            <span style={{fontSize:'12px',color:'#666',lineHeight:'1.5'}}>
              Acepto los <Link href="/terminos" target="_blank" rel="noopener noreferrer" style={{color:'#E8390E',fontWeight:600}}>Términos y Condiciones</Link> y la <Link href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" style={{color:'#E8390E',fontWeight:600}}>Política de Privacidad</Link> de MotoPatío
            </span>
          </div>
          {error && <div style={{background:'#FCEBEB',color:'#A32D2D',padding:'10px',borderRadius:'4px',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'12px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer',textTransform:'uppercase'}}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'20px'}}>
          Ya tienes cuenta? <Link href="/auth/login" style={{color:'#E8390E',fontWeight:600,textDecoration:'none'}}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}