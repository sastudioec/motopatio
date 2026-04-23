import type { Metadata } from 'next'
import Link from 'next/link'
import Hero from './components/Hero'
import Banner from './components/Banner'
import MotoCard from './components/MotoCard'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: {
    absolute: 'Motos usadas en Ecuador: compra, vende y publica | MotoPatío',
  },
  description:
    'Motos usadas y de segunda mano en Ecuador. Shineray, Honda, Yamaha, Bajaj, Suzuki y más. Publica tu moto gratis en Quito, Guayaquil, Cuenca y todo el país.',
  keywords: [
    'motos usadas Ecuador',
    'venta de motos Ecuador',
    'comprar moto Ecuador',
    'motocicletas usadas Ecuador',
    'motos de segunda mano Ecuador',
    'motos Quito',
    'motos Guayaquil',
    'motos Cuenca',
    'publicar moto Ecuador',
    'vender mi moto',
    'clasificados motos Ecuador',
    'Shineray', 'Honda', 'Yamaha', 'Suzuki', 'Bajaj', 'Pulsar', 'Kawasaki',
    'scooter Ecuador', 'motoneta', 'pasola',
    'motos 125cc', 'motos 150cc', 'motos 200cc', 'motos baratas',
  ],
  alternates: { canonical: 'https://motopatio.com/' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/',
    title: 'Motos usadas en Ecuador | MotoPatío',
    description:
      'Compra y vende motos usadas y nuevas en Ecuador. Shineray, Honda, Yamaha, Bajaj y más. Publica gratis en Quito, Guayaquil, Cuenca.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'MotoPatío — Motos usadas en Ecuador',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motos usadas en Ecuador | MotoPatío',
    description:
      'Compra, vende y publica motos en Ecuador. Shineray, Honda, Yamaha, Bajaj y más.',
    images: ['/og-default.jpg'],
  },
}

async function getDestacadas() {
  try {
    return await prisma.listing.findMany({
      where: {
        estado: 'activo',
        destacadoHasta: { gt: new Date() },
      },
      orderBy: { destacadoHasta: 'desc' },
      take: 8,
    })
  } catch {
    return []
  }
}

async function getRecientes(excludeIds: string[]) {
  try {
    return await prisma.listing.findMany({
      where: {
        estado: 'activo',
        id: { notIn: excludeIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
  } catch {
    return []
  }
}

export default async function Home() {
  const destacadas = await getDestacadas()
  const recientes = await getRecientes(destacadas.map(d => d.id))
  const listings = [...destacadas, ...recientes]

  return (
    <main>
      
      <Hero bannerSlot={<Banner position="hero" fill />} />
      <div style={{background:'#f4f4f4'}}>
        {destacadas.length > 0 && (
          <div style={{padding:'24px 20px',maxWidth:'1200px',margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <div style={{display:'flex',alignItems:'center'}}>
                <div style={{background:'#E8390E',color:'white',fontSize:'13px',fontWeight:800,textTransform:'uppercase',padding:'7px 18px 7px 14px'}}>Motos Destacadas</div>
                <div style={{flex:1,height:'2px',background:'#e0e0e0',width:'40px'}}></div>
              </div>
              <Link href="/motos" style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Mostrar todo</Link>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
              {destacadas.map(l => <MotoCard key={l.id} l={l} />)}
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
          {listings.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px',color:'#888',fontSize:'14px'}}>
              Aún no hay motos publicadas. <Link href="/publicar" style={{color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Sé el primero en publicar</Link>
            </div>
          ) : recientes.length === 0 ? (
            <div style={{textAlign:'center',padding:'24px',color:'#888',fontSize:'13px'}}>
              Por ahora todas las motos activas están destacadas. <Link href="/motos" style={{color:'#E8390E',fontWeight:700,textDecoration:'none'}}>Ver todas</Link>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
              {recientes.slice(0,4).map(l => <MotoCard key={l.id} l={l} />)}
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
          <p style={{fontSize:'13px',color:'#7a82a0',marginBottom:'22px'}}>Publica tu moto gratis y llega a miles de compradores en todo el Ecuador</p>
          <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
            <Link href="/publicar" style={{background:'#E8390E',color:'white',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Publicar mi moto</Link>
            <Link href="/precios" style={{background:'transparent',color:'#fff',border:'2px solid #fff',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Ver planes</Link>
          </div>
        </div>
      </div>
      
    </main>
  )
}