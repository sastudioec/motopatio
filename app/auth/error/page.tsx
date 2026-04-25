import Link from 'next/link'
import Image from 'next/image'

type SearchParams = { reason?: string; error?: string }

export const dynamic = 'force-dynamic'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const reason = sp.reason

  let title: string
  let message: string
  let ctaLabel: string
  let ctaHref: string

  if (reason === 'signup_email_exists') {
    title = 'Email ya registrado'
    message = 'Este email ya está registrado en MotoPatio.'
    ctaLabel = 'Iniciar sesión'
    ctaHref = '/auth/login'
  } else if (reason === 'signin_no_account') {
    title = 'Cuenta no encontrada'
    message = 'No encontramos una cuenta con este email.'
    ctaLabel = 'Crear cuenta'
    ctaHref = '/auth/registro'
  } else if (reason === 'signin_credentials_only') {
    title = 'Esta cuenta usa contraseña'
    message = 'Esta cuenta usa contraseña. Inicia sesión con email y contraseña.'
    ctaLabel = 'Iniciar con email'
    ctaHref = '/auth/login'
  } else {
    title = 'Ocurrió un error'
    message = 'Ocurrió un error. Vuelve a intentarlo.'
    ctaLabel = 'Volver a login'
    ctaHref = '/auth/login'
  }

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'8px',padding:'40px',width:'100%',maxWidth:'420px',border:'1px solid #e8e8e8'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <Link href="/">
            <Image src="/motopatio-logo.png" alt="MotoPatio" width={180} height={60} priority style={{height:'auto',width:'auto',maxWidth:'180px'}} />
          </Link>
        </div>

        <h1 style={{fontSize:'18px',fontWeight:700,color:'#333',textAlign:'center',margin:'0 0 12px'}}>{title}</h1>
        <p style={{fontSize:'14px',color:'#666',lineHeight:'1.6',textAlign:'center',margin:'0 0 24px'}}>{message}</p>

        <Link href={ctaHref} style={{display:'block',width:'100%',padding:'12px',background:'#E8390E',color:'#fff',borderRadius:'4px',fontSize:'14px',fontWeight:800,fontFamily:'Montserrat,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
