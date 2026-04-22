'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo procesar la solicitud')
      } else {
        setMessage(data.message || 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.')
        setEmail('')
      }
    } catch {
      setError('Error de red. Intenta nuevamente.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatío" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
          </Link>
          <p style={{fontSize:'14px',color:'#666',marginTop:'8px'}}>Restablece tu contraseña</p>
        </div>

        <p style={{fontSize:'13px',color:'#666',marginBottom:'20px',lineHeight:'1.5'}}>
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',outline:'none'}}
              placeholder="tu@email.com" />
          </div>
          {message && <div style={{background:'#e8f5e9',color:'#2e7d32',padding:'12px',borderRadius:'4px',fontSize:'13px',marginBottom:'16px'}}>{message}</div>}
          {error && <div style={{background:'#FCEBEB',color:'#A32D2D',padding:'10px',borderRadius:'4px',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'12px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px'}}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'20px'}}>
          <Link href="/auth/login" style={{color:'#E8390E',fontWeight:600,textDecoration:'none'}}>Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
