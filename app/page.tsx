import Link from 'next/link'
import Image from 'next/image'
import Hero from './components/Hero'
import Banner from './components/Banner'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: { estado: 'activo' },
      orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    })
    return listings
  } catch {
    return []
  }
}

export default async function Home() {
  const listings = await getListings()
  const destacadas = listings.filter(l => l.destacado)
  const recientes = listings.filter(l => !l.destacado)

  return (
    <main>
      
      <Hero bannerSlot={<Banner position="hero" aspectRatio="4/1" />} />
      <div style={{background:'#f4f4f4'}}>
        {destacadas.length > 0 && (
          <div style={{padding:'24px 20px',maxWidth:'1200px',margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <div style={{display:'flex',alignItems:'center'}}>
                <div style={{background:'#E8390E',color:'white',fontSize:'13px',fontWeight:800,textTransform:'uppercase',padding:'7px 18px 7px 14px'}}>Clasificado Destacado</div>
                <div style={{flex:1,height:'2px',background:'#e0e0e0',width:'40px'}}></div>
              </div>
              <Link href="/motos" style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Mostrar todo</Link>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,240px))',gap:'12px',justifyContent:'center'}}>
              {destacadas.slice(0,4).map(l => <MotoCard key={l.id} l={l} />)}
            </div>
          </div>
        )}
        <div style={{borderTop:'1px solid #e8e8e8'}}></div>
        <div style={{padding:'24px 20px',maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
            <div style={{display:'flex',alignItems:'center'}}>
              <div style={{background:'#E8390E',color:'white',fontSize:'13px',fontWeight:800,textTransform:'uppercase',padding:'7px 18px 7px 14px'}}>Motos Recientes</div>
              <div style={{height:'2px',background:'#e0e0e0',width:'40px'}}></div>
            </div>
            <Link href="/motos" style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Ver todas</Link>
          </div>
          {recientes.length === 0 && listings.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px',color:'#888',fontSize:'14px'}}>
              Aún no hay motos publicadas. <Link href="/publicar" style={{color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Sé el primero en publicar</Link>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,240px))',gap:'12px',justifyContent:'center'}}>
              {(recientes.length > 0 ? recientes : listings).slice(0,4).map(l => <MotoCard key={l.id} l={l} />)}
            </div>
          )}
        </div>
        <div style={{maxWidth:'1200px',margin:'0 auto',padding:'8px 20px'}}>
          <div style={{height:'2px',background:'#E8390E',opacity:0.5,borderRadius:'2px'}}></div>
        </div>
        <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'16px'}}>
          <Banner position="mid_left" aspectRatio="4/1" />
          <Banner position="mid_right" aspectRatio="4/1" />
        </div>
        <div style={{background:'#1E2340',padding:'36px 24px',textAlign:'center'}}>
          <h2 style={{fontSize:'34px',fontWeight:900,color:'#fff',marginBottom:'6px'}}>Vende tu moto con nosotros</h2>
          <p style={{fontSize:'13px',color:'#7a82a0',marginBottom:'22px'}}>Llega a miles de compradores en Ecuador</p>
          <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
            <Link href="/publicar" style={{background:'#E8390E',color:'white',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Publicar mi moto</Link>
            <Link href="/precios" style={{background:'transparent',color:'#fff',border:'2px solid #fff',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Ver planes</Link>
          </div>
        </div>
      </div>
      
    </main>
  )
}

function MotoCard({ l }: { l: any }) {
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