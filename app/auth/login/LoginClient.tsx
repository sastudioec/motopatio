'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function isSafeRelativeUrl(s: string | null): boolean {
  if (!s) return false
  if (!s.startsWith('/')) return false
  if (s.startsWith('//') || s.startsWith('/\\')) return false
  return true
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nextParam, setNextParam] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nxt = params.get('next')
    if (isSafeRelativeUrl(nxt)) setNextParam(nxt)
    if (params.get('verified') === '1') {
      setSuccess('\u00a1Correo verificado! Ya puedes ingresar con tu cuenta.')
    }
    if (params.get('reset') === '1') {
      setSuccess('Contraseña actualizada. Ya puedes ingresar con tu nueva contraseña.')
    }
    if (params.get('error') === 'token_invalido') {
      setError('Token inv\u00e1lido. Solicita un nuevo correo de verificaci\u00f3n.')
    }
    if (params.get('error') === 'token_expirado') {
      setError('El enlace expir\u00f3. Solicita un nuevo correo de verificaci\u00f3n.')
    }
  }, [])

  // /auth/post-login decide a donde mandar al usuario segun rol + next.
  const postLoginUrl = '/auth/post-login' + (nextParam ? '?next=' + encodeURIComponent(nextParam) : '')

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    if (res?.error) {
      try {
        const check = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = await check.json()
        if (data.exists && data.isGoogleOnly) {
          setError('Esta cuenta fue creada con Google. Pulsa el botón "Continuar con Google" para ingresar.')
        } else {
          setError('Email o contraseña incorrectos')
        }
      } catch {
        setError('Email o contraseña incorrectos')
      }
      setLoading(false)
    } else {
      router.push(postLoginUrl)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatio" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
          </Link>
          <p style={{fontSize:'14px',color:'#666',marginTop:'8px'}}>Inicia sesión en tu cuenta</p>
        </div>

        <button
          onClick={() => {
            document.cookie = `mp_intent=signin; Max-Age=300; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
            signIn('google', { callbackUrl: postLoginUrl })
          }}
          style={{width:'100%',padding:'12px',border:'1px solid #e0e0e0',borderRadius:'4px',background:'#fff',fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'20px',fontFamily:'Montserrat,sans-serif'}}>
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
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none'}}
              placeholder="tu@email.com" />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none'}}
              placeholder="••••••••" />
            <div style={{textAlign:'right',marginTop:'6px'}}>
              <Link href="/auth/forgot-password" style={{fontSize:'12px',color:'#E8390E',textDecoration:'none',fontWeight:600}}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          {success && <div style={{background:'#e8f5e9',color:'#2e7d32',padding:'12px',borderRadius:'4px',fontSize:'14px',marginBottom:'16px',textAlign:'center',fontWeight:'600'}}>{success}</div>}
          {error && <div style={{background:'#FCEBEB',color:'#A32D2D',padding:'10px',borderRadius:'4px',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'12px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px'}}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'20px'}}>
          No tienes cuenta? <Link href="/auth/registro" style={{color:'#E8390E',fontWeight:600,textDecoration:'none'}}>Regístrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
