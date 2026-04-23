import Link from 'next/link'
import Image from 'next/image'

type MotoLike = {
  id: string
  slug?: string | null
  marca: string
  modelo: string
  anio: number
  km: number
  precio: number
  ciudad: string
  fotos?: string | null
  destacado?: boolean
}

export default function MotoCard({ l }: { l: MotoLike }) {
  const fotos = (() => { try { return JSON.parse(l.fotos || '[]') } catch { return [] } })()
  const href = '/motos/' + (l.slug || l.id)
  return (
    <Link href={href} style={{textDecoration:'none'}}>
      <div style={{background:'#fff',borderRadius:'4px',overflow:'hidden',border:l.destacado?'1.5px solid #E8390E':'1.5px solid #e8e8e8'}}>
        <div style={{height:'140px',background:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',position:'relative'}}>
          {fotos[0] ? (
            <Image
              src={fotos[0]}
              alt={`${l.marca} ${l.modelo} ${l.anio} - ${l.ciudad}`}
              width={400}
              height={300}
              sizes="(max-width: 600px) 50vw, 240px"
              style={{width:'100%',height:'100%',objectFit:'cover'}}
            />
          ) : '🏍️'}
          {l.destacado && <div style={{position:'absolute',top:0,right:0,background:'#E8390E',color:'white',fontSize:'9px',fontWeight:800,padding:'4px 10px'}}>DESTACADA</div>}
        </div>
        <div style={{padding:'9px 11px'}}>
          <div style={{fontSize:'13px',fontWeight:700,color:'#1E2340',textTransform:'uppercase'}}>{l.marca} {l.modelo}</div>
          <div style={{fontSize:'18px',fontWeight:800,color:'#E8390E'}}>${l.precio?.toLocaleString()}</div>
          <div style={{fontSize:'10px',color:'#999',display:'flex',gap:'8px'}}><span>{l.anio}</span><span>{l.km?.toLocaleString()} km</span><span>{l.ciudad}</span></div>
        </div>
      </div>
    </Link>
  )
}
