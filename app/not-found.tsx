import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'460px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatio" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
          </Link>
        </div>

        <h1 style={{fontSize:'22px',fontWeight:800,color:'#333',textAlign:'center',margin:'0 0 12px',fontFamily:'Montserrat,sans-serif'}}>Te saliste del camino</h1>
        <p style={{fontSize:'14px',color:'#666',lineHeight:'1.6',textAlign:'center',margin:'0 0 28px'}}>Esta página no existe o fue movida.</p>

        <Link href="/" style={{display:'block',width:'100%',padding:'12px',background:'#E8390E',color:'#fff',borderRadius:'4px',fontSize:'14px',fontWeight:800,fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',textDecoration:'none',boxSizing:'border-box',marginBottom:'10px'}}>
          Volver al inicio
        </Link>

        <Link href="/motos" style={{display:'block',width:'100%',padding:'12px',background:'#fff',color:'#333',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'14px',fontWeight:600,fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>
          Ver motos
        </Link>
      </div>
    </div>
  )
}
