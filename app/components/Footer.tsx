import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{background:'#111827',fontFamily:'Montserrat,sans-serif'}}>
      <div style={{padding:'40px 20px',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'32px',borderBottom:'1px solid #1f2937'}}>

        <div style={{maxWidth:'240px'}}>
          <Link href="/" style={{display:"inline-block"}}><Image src="/logo-blanco-moto-patio.png" alt="MotoPatío" width={160} height={40} style={{height:"40px",width:'auto',display:"block"}} /></Link>
          <p style={{fontSize:'12px',color:'#6b7280',marginTop:'8px'}}>El patio de motos digital del Ecuador.</p>
          <a href="mailto:info@motopatio.com" style={{fontSize:'12px',color:'#9ca3af',textDecoration:'none',marginTop:'10px',display:'inline-block'}}>info@motopatio.com</a>

          <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
            <a href="https://instagram.com/motopatiolat" target="_blank" rel="noopener noreferrer" aria-label="Instagram MotoPatío" style={{width:'34px',height:'34px',borderRadius:'50%',background:'#1f2937',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',textDecoration:'none',transition:'all 0.2s'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://facebook.com/motopatiolat" target="_blank" rel="noopener noreferrer" aria-label="Facebook MotoPatío" style={{width:'34px',height:'34px',borderRadius:'50%',background:'#1f2937',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',textDecoration:'none',transition:'all 0.2s'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
            </a>
            <a href="https://tiktok.com/@motopatiolat" target="_blank" rel="noopener noreferrer" aria-label="TikTok MotoPatío" style={{width:'34px',height:'34px',borderRadius:'50%',background:'#1f2937',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',textDecoration:'none',transition:'all 0.2s'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
            </a>
          </div>
        </div>

        <div>
          <div style={{fontSize:'12px',fontWeight:800,color:'#fff',textTransform:'uppercase',marginBottom:'12px'}}>Plataforma</div>
          <Link href="/motos" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Ver motos</Link>
          <Link href="/publicar" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Publicar moto</Link>
          <Link href="/precios" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Planes y precios</Link>
          <Link href="/blog" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Blog</Link>
        </div>

        <div>
          <div style={{fontSize:'12px',fontWeight:800,color:'#fff',textTransform:'uppercase',marginBottom:'12px'}}>Soporte</div>
          <Link href="/contacto" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Contacto</Link>
        </div>

        <div>
          <div style={{fontSize:'12px',fontWeight:800,color:'#fff',textTransform:'uppercase',marginBottom:'12px'}}>Legal</div>
          <Link href="/terminos" target="_blank" rel="noopener noreferrer" style={{display:'block',color:'#6b7280',textDecoration:'none',fontSize:'12px',marginBottom:'8px'}}>Términos y Condiciones</Link>
          <Link href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" style={{display:"block",color:"#6b7280",textDecoration:"none",fontSize:"12px",marginBottom:"8px"}}>Política de Privacidad</Link>
          <Link href="/politica-de-reembolsos" target="_blank" rel="noopener noreferrer" style={{display:"block",color:"#6b7280",textDecoration:"none",fontSize:"12px",marginBottom:"8px"}}>Política de Reembolsos</Link>
        </div>

      </div>

      <div style={{padding:'14px 20px',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
        <div style={{fontSize:'11px',color:'#4a5568'}}>© 2026 MotoPatío · SAStudio LATAM</div>
        <div style={{fontSize:'11px',color:'#4a5568'}}>Operado desde Ecuador 🇪🇨</div>
      </div>
    </footer>
  )
}
