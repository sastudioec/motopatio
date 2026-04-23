'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita un nuevo correo de recuperación.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'token_invalido') {
          setExpired(true)
        } else {
          setError(data.error || 'No se pudo restablecer la contraseña')
        }
        setLoading(false)
        return
      }
      router.push('/auth/login?reset=1')
    } catch {
      setError('Error de red. Intenta nuevamente.')
      setLoading(false)
    }
  }

  if (expired) {
    return (
      <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
        <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <Link href="/">
              <Image src="/motopatio-logo.png" alt="MotoPatío" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
            </Link>
          </div>
          <div style={{background:'#FCEBEB',color:'#A32D2D',padding:'16px',borderRadius:'4px',fontSize:'14px',marginBottom:'20px',textAlign:'center'}}>
            El enlace expiró o ya fue usado. Solicita uno nuevo para continuar.
          </div>
          <Link href="/auth/forgot-password"
            style={{display:'block',width:'100%',padding:'12px',background:'#E8390E',color:'white',borderRadius:'4px',fontSize:'14px',fontWeight:800,fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',textDecoration:'none'}}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatío" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
          </Link>
          <p style={{fontSize:'14px',color:'#666',marginTop:'8px'}}>Crea tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Nueva contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none'}}
              placeholder="Mínimo 6 caracteres" />
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Confirma la contraseña</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={6}
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none'}}
              placeholder="Repite la contraseña" />
          </div>
          {error && <div style={{background:'#FCEBEB',color:'#A32D2D',padding:'10px',borderRadius:'4px',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}
          <button type="submit" disabled={loading || !token}
            style={{width:'100%',padding:'12px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px'}}>
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'20px'}}>
          <Link href="/auth/login" style={{color:'#E8390E',fontWeight:600,textDecoration:'none'}}>Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#f4f4f4'}} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
