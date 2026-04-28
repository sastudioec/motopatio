'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [hover, setHover] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [dealersEnabled, setDealersEnabled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const role = (session?.user as any)?.role as string | undefined
  const isDealer = role === 'dealer'

  useEffect(() => {
    fetch('/api/dealers/config').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.enabled) setDealersEnabled(true)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/motos', label: 'Motos' },
    ...(dealersEnabled ? [{ href: '/dealers', label: 'Dealers' }] : []),
    { href: '/precios', label: 'Precios' },
    { href: '/blog', label: 'Blog' },
  ]

  return (
    <>
      <div style={{background:'#1E2340',padding:'6px 20px',display: isMobile ? 'none' : 'flex',alignItems:'center',justifyContent:'space-between',fontSize:'11px',color:'#7a82a0'}}>
        <div>
          <span style={{marginRight:'16px'}}>📍 Ecuador · Latam</span>
          <span style={{marginRight:'16px'}}>🕐 24/7</span>
          <a href="mailto:info@motopatio.com" style={{color:'#7a82a0',textDecoration:'none',fontSize:'11px'}}>📧 info@motopatio.com</a>
        </div>
        <div style={{display:'flex',gap:'14px'}}>
          <Link href="/ayuda" style={{color:'#7a82a0',textDecoration:'none',fontSize:'11px'}}>Ayuda</Link>
          <Link href="/contacto" style={{color:'#7a82a0',textDecoration:'none',fontSize:'11px'}}>Contacto</Link>
        </div>
      </div>

      <nav style={{background:'#fff',padding: isMobile ? '0 12px' : '0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height: isMobile ? '60px' : '70px',borderBottom:'3px solid #E8390E',position:'sticky',top:0,zIndex:100}}>

        <Link href="/" style={{display:'flex',alignItems:'center',flexShrink:0}}>
          <Image src="/motopatio-logo.png" alt="MotoPatío" width={160} height={38} priority style={{height: isMobile ? '32px' : '38px',width:'auto'}} />
        </Link>

        {!isMobile && (
          <div style={{display:'flex'}}>
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}
                onMouseEnter={() => setHover(item.href)}
                onMouseLeave={() => setHover('')}
                style={{color: hover === item.href ? '#E8390E' : '#1E2340',textDecoration:'none',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:'13px',textTransform:'uppercase',padding:'0 16px',height:'70px',display:'flex',alignItems:'center',borderBottom: hover === item.href ? '3px solid #E8390E' : '3px solid transparent',transition:'all 0.15s',marginBottom:'-3px'}}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div style={{display:'flex',alignItems:'center',gap: isMobile ? '8px' : '10px',flexShrink:0}}>

          {!isMobile && session && (
            <div ref={menuRef} style={{position:'relative'}}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                style={{display:'flex',alignItems:'center',gap:'8px',background:'transparent',border:'none',cursor:'pointer',padding:'4px 8px'}}>
                <div style={{width:'34px',height:'34px',borderRadius:'50%',background:'#E8390E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:900,color:'white'}}>
                  {(session.user?.name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <span style={{fontSize:'13px',fontWeight:600,color:'#1E2340'}}>{session.user?.name?.split(' ')[0]}</span>
                <span style={{fontSize:'10px',color:'#888'}}>▼</span>
              </button>
              {menuOpen && (
                <div style={{position:'absolute',top:'48px',right:0,background:'#fff',border:'1px solid #e0e0e0',borderRadius:'4px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',minWidth:'180px',zIndex:200}}>
                  <Link href="/perfil" onClick={() => setMenuOpen(false)}
                    style={{display:'block',padding:'12px 16px',fontSize:'13px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                    👤 Mi perfil
                  </Link>
                  {isDealer ? (
                    <Link href="/mi-tienda" onClick={() => setMenuOpen(false)}
                      style={{display:'block',padding:'12px 16px',fontSize:'13px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                      🏬 Mi Tienda
                    </Link>
                  ) : (
                    <Link href="/mis-motos" onClick={() => setMenuOpen(false)}
                      style={{display:'block',padding:'12px 16px',fontSize:'13px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                      🏍️ Mis motos
                    </Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    style={{display:'block',width:'100%',textAlign:'left',padding:'12px 16px',fontSize:'13px',color:'#E8390E',background:'transparent',border:'none',cursor:'pointer',fontWeight:600}}>
                    🚪 Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMobile && !session && (
            <Link href="/auth/login" style={{background:'transparent',color:'#1E2340',border:'2px solid #1E2340',padding:'8px 16px',fontFamily:'Montserrat,sans-serif',fontSize:'12px',fontWeight:700,borderRadius:'3px',textDecoration:'none',textTransform:'uppercase'}}>
              Ingresar
            </Link>
          )}

          <Link href="/publicar" style={{background:'#E8390E',color:'white',padding: isMobile ? '8px 14px' : '10px 20px',fontFamily:'Montserrat,sans-serif',fontSize: isMobile ? '12px' : '13px',fontWeight:800,borderRadius:'3px',textDecoration:'none',textTransform:'uppercase',whiteSpace:'nowrap'}}>
            + Publicar
          </Link>

          {isMobile && (
            <button onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
              style={{background:'transparent',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'4px',width:'40px',height:'40px',justifyContent:'center',alignItems:'center'}}>
              <span style={{width:'22px',height:'2px',background:'#1E2340',display:'block',transition:'all 0.2s',transform: mobileOpen ? 'rotate(45deg) translate(4px,4px)' : 'none'}} />
              <span style={{width:'22px',height:'2px',background:'#1E2340',display:'block',transition:'all 0.2s',opacity: mobileOpen ? 0 : 1}} />
              <span style={{width:'22px',height:'2px',background:'#1E2340',display:'block',transition:'all 0.2s',transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none'}} />
            </button>
          )}

        </div>
      </nav>

      {isMobile && mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{position:'fixed',inset:0,top:'60px',background:'rgba(0,0,0,0.4)',zIndex:90}} />
          <div style={{position:'fixed',top:'60px',left:0,right:0,background:'#fff',zIndex:95,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',maxHeight:'calc(100vh - 60px)',overflowY:'auto'}}>

            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{display:'block',padding:'16px 20px',color:'#1E2340',textDecoration:'none',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:'14px',textTransform:'uppercase',borderBottom:'1px solid #f0f0f0'}}>
                {item.label}
              </Link>
            ))}

            {session ? (
              <>
                <div style={{padding:'16px 20px',background:'#fafafa',display:'flex',alignItems:'center',gap:'12px',borderBottom:'1px solid #f0f0f0'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#E8390E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:900,color:'white'}}>
                    {(session.user?.name?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:'#1E2340'}}>{session.user?.name?.split(' ')[0]}</div>
                    <div style={{fontSize:'11px',color:'#888'}}>{session.user?.email}</div>
                  </div>
                </div>
                <Link href="/perfil" onClick={() => setMobileOpen(false)}
                  style={{display:'block',padding:'14px 20px',fontSize:'14px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                  👤 Mi perfil
                </Link>
                {isDealer ? (
                  <Link href="/mi-tienda" onClick={() => setMobileOpen(false)}
                    style={{display:'block',padding:'14px 20px',fontSize:'14px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                    🏬 Mi Tienda
                  </Link>
                ) : (
                  <Link href="/mis-motos" onClick={() => setMobileOpen(false)}
                    style={{display:'block',padding:'14px 20px',fontSize:'14px',color:'#1E2340',textDecoration:'none',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                    🏍️ Mis motos
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }) }}
                  style={{display:'block',width:'100%',textAlign:'left',padding:'14px 20px',fontSize:'14px',color:'#E8390E',background:'transparent',border:'none',cursor:'pointer',fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>
                  🚪 Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                style={{display:'block',padding:'16px 20px',fontSize:'14px',color:'#1E2340',textDecoration:'none',fontWeight:700,borderBottom:'1px solid #f0f0f0'}}>
                👤 Ingresar
              </Link>
            )}

            <Link href="/ayuda" onClick={() => setMobileOpen(false)}
              style={{display:'block',padding:'14px 20px',fontSize:'13px',color:'#666',textDecoration:'none',fontWeight:500,borderBottom:'1px solid #f0f0f0'}}>
              ❓ Ayuda
            </Link>
            <Link href="/contacto" onClick={() => setMobileOpen(false)}
              style={{display:'block',padding:'14px 20px',fontSize:'13px',color:'#666',textDecoration:'none',fontWeight:500,borderBottom:'1px solid #f0f0f0'}}>
              ✉️ Contacto
            </Link>

            <div style={{padding:'16px 20px',background:'#fafafa',fontSize:'11px',color:'#888'}}>
              📍 Ecuador · Latam · 🕐 24/7
              <br />
              <a href="mailto:info@motopatio.com" style={{color:'#E8390E',textDecoration:'none'}}>info@motopatio.com</a>
            </div>

          </div>
        </>
      )}
    </>
  )
}
