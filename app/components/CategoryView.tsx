import Link from 'next/link'
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb'
import MotoCard from './MotoCard'

export type CrossLinkSection = {
  title: string
  items: Array<{ label: string; href: string; count?: number }>
}

export type EmptyStateCta = { label: string; href: string }

type Props = {
  h1: string
  subcopy: string
  breadcrumb: BreadcrumbItem[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[]
  publishCta: { label: string; href: string }
  viewAllCta?: { label: string; href: string }
  emptyState?: { message: string; ctas: EmptyStateCta[] }
  crossLinks?: CrossLinkSection[]
}

export default function CategoryView({ h1, subcopy, breadcrumb, listings, publishCta, viewAllCta, emptyState, crossLinks }: Props) {
  const empty = listings.length === 0
  return (
    <main>
      <div style={{background:'#f4f4f4',minHeight:'100vh'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px 20px'}}>
          <Breadcrumb items={breadcrumb} />

          <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'28px',fontWeight:900,color:'#1E2340',margin:'0 0 6px 0',lineHeight:1.2}}>
            {h1}
          </h1>
          <p style={{fontSize:'14px',color:'#555',margin:'0 0 16px 0',lineHeight:1.55,maxWidth:'780px'}}>
            {subcopy}
          </p>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'24px'}}>
            <Link href={publishCta.href} style={{background:'#E8390E',color:'#fff',padding:'10px 20px',borderRadius:'4px',fontSize:'13px',fontWeight:800,textDecoration:'none',textTransform:'uppercase'}}>
              {publishCta.label}
            </Link>
            {viewAllCta && (
              <Link href={viewAllCta.href} style={{background:'transparent',color:'#1E2340',padding:'10px 20px',borderRadius:'4px',fontSize:'13px',fontWeight:700,textDecoration:'none',textTransform:'uppercase',border:'1px solid #1E2340'}}>
                {viewAllCta.label}
              </Link>
            )}
          </div>

          {empty ? (
            <div style={{background:'#fff',borderRadius:'8px',padding:'48px 24px',textAlign:'center',border:'1px solid #e8e8e8',marginBottom:'32px'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>🏍️</div>
              <div style={{fontSize:'16px',fontWeight:700,color:'#1E2340',marginBottom:'18px'}}>
                {emptyState?.message ?? 'No hay motos disponibles por ahora.'}
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center'}}>
                {(emptyState?.ctas ?? []).map(cta => (
                  <Link key={cta.href} href={cta.href} style={{background:'#1E2340',color:'#fff',padding:'10px 18px',borderRadius:'4px',fontSize:'13px',fontWeight:700,textDecoration:'none'}}>
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px',marginBottom:'32px'}}>
              {listings.map(l => <MotoCard key={l.id} l={l} />)}
            </div>
          )}

          {crossLinks && crossLinks.length > 0 && (
            <section style={{background:'#fff',borderRadius:'8px',padding:'24px',border:'1px solid #e8e8e8',marginBottom:'24px'}}>
              {crossLinks.map(section => (
                <div key={section.title} style={{marginBottom:'18px'}}>
                  <div style={{fontSize:'12px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>
                    {section.title}
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                    {section.items.map(item => (
                      <Link key={item.href} href={item.href} style={{background:'#f4f4f4',color:'#1E2340',padding:'6px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>
                        {item.label}{typeof item.count === 'number' ? ` (${item.count})` : ''}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
