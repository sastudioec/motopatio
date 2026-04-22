'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function ContactoPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [asunto, setAsunto] = useState('Tengo una pregunta')
  const [mensaje, setMensaje] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit() {
    setSending(true)
    setStatus('idle')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, asunto, mensaje, website })
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Error al enviar')
        return
      }
      setStatus('ok')
      setNombre('')
      setEmail('')
      setAsunto('Tengo una pregunta')
      setMensaje('')
    } catch {
      setStatus('error')
      setErrorMsg('Error de conexión. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{maxWidth:'900px',margin:'0 auto',padding:'48px 20px'}}>
        <div style={{textAlign:'center',marginBottom:'48px'}}>
          <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'36px',fontWeight:900,color:'#1E2340',marginBottom:'8px'}}>Contáctanos</h1>
          <p style={{fontSize:'15px',color:'#666'}}>Estamos aquí para ayudarte. Escríbenos y te respondemos en menos de 48 horas hábiles.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px'}}>
          <div>
            <div style={{background:'#fff',borderRadius:'8px',padding:'32px',border:'1px solid #e8e8e8',marginBottom:'16px'}}>
              <div style={{fontSize:'14px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'20px'}}>Información de contacto</div>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'16px'}}>
                <div style={{fontSize:'20px',flexShrink:0}}>📧</div>
                <div>
                  <div style={{fontSize:'11px',color:'#888',fontWeight:600,textTransform:'uppercase'}}>Email</div>
                  <a href="mailto:info@motopatio.com" style={{fontSize:'14px',fontWeight:600,color:'#E8390E',textDecoration:'none'}}>info@motopatio.com</a>
                </div>
              </div>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'16px'}}>
                <div style={{fontSize:'20px',flexShrink:0}}>📍</div>
                <div>
                  <div style={{fontSize:'11px',color:'#888',fontWeight:600,textTransform:'uppercase'}}>Ciudad</div>
                  <div style={{fontSize:'14px',fontWeight:600,color:'#1E2340'}}>Quito, Ecuador</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'16px'}}>
                <div style={{fontSize:'20px',flexShrink:0}}>🕐</div>
                <div>
                  <div style={{fontSize:'11px',color:'#888',fontWeight:600,textTransform:'uppercase'}}>Horario</div>
                  <div style={{fontSize:'14px',fontWeight:600,color:'#1E2340'}}>Lun - Vie: 9am - 6pm</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                <div style={{fontSize:'20px',flexShrink:0}}>🏢</div>
                <div>
                  <div style={{fontSize:'11px',color:'#888',fontWeight:600,textTransform:'uppercase'}}>Operado por</div>
                  <div style={{fontSize:'14px',fontWeight:600,color:'#1E2340'}}>SAStudio LATAM</div>
                </div>
              </div>
            </div>
            <div style={{background:'#fff8e6',border:'1px solid #f5c451',borderLeft:'4px solid #E8390E',borderRadius:'8px',padding:'16px 20px'}}>
              <p style={{fontSize:'12px',color:'#444',margin:0,lineHeight:1.6}}>
                Para consultas sobre <strong>reembolsos o cobros</strong>, revisa primero nuestra <Link href="/politica-de-reembolsos" style={{color:'#E8390E',fontWeight:600}}>política de reembolsos</Link> e incluye tu número de transacción de PayPhone al escribirnos.
              </p>
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:'8px',padding:'32px',border:'1px solid #e8e8e8'}}>
            <div style={{fontSize:'14px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'20px'}}>Envíanos un mensaje</div>
            {status === 'ok' && (
              <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:'6px',padding:'12px 16px',marginBottom:'16px'}}>
                <p style={{fontSize:'13px',color:'#166534',margin:0,fontWeight:600}}>✓ Mensaje enviado. Te responderemos pronto.</p>
              </div>
            )}
            {status === 'error' && (
              <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'6px',padding:'12px 16px',marginBottom:'16px'}}>
                <p style={{fontSize:'13px',color:'#991b1b',margin:0,fontWeight:600}}>✗ {errorMsg}</p>
              </div>
            )}
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',boxSizing:'border-box'}} placeholder="Tu nombre" disabled={sending} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',boxSizing:'border-box'}} placeholder="tu@email.com" disabled={sending} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Asunto</label>
              <select value={asunto} onChange={(e) => setAsunto(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',boxSizing:'border-box'}} disabled={sending}>
                <option>Tengo una pregunta</option>
                <option>Problema con mi publicación</option>
                <option>Quiero anunciar</option>
                <option>Solicitud de reembolso</option>
                <option>Reporte de usuario</option>
                <option>Otro</option>
              </select>
            </div>
            <div style={{marginBottom:'20px'}}>
              <label style={{fontSize:'12px',fontWeight:600,color:'#333',display:'block',marginBottom:'6px'}}>Mensaje</label>
              <textarea rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{width:'100%',padding:'10px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}} placeholder="Escribe tu mensaje..." disabled={sending} />
            </div>
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} style={{position:'absolute',left:'-9999px',width:'1px',height:'1px',opacity:0}} tabIndex={-1} autoComplete="off" />
            <button onClick={handleSubmit} disabled={sending} style={{width:'100%',padding:'12px',background: sending ? '#aaa' : '#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor: sending ? 'not-allowed' : 'pointer',textTransform:'uppercase'}}>
              {sending ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
