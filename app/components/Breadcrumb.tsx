import Link from 'next/link'

export type BreadcrumbItem = { label: string; href?: string }

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="breadcrumb" style={{fontSize:'12px',color:'#666',marginBottom:'16px'}}>
      <ol style={{listStyle:'none',padding:0,margin:0,display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center'}}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} style={{display:'flex',alignItems:'center',gap:'6px'}}>
              {item.href && !isLast ? (
                <Link href={item.href} style={{color:'#E8390E',textDecoration:'none',fontWeight:600}}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={{color: isLast ? '#1E2340' : '#666', fontWeight: isLast ? 700 : 400}}>
                  {item.label}
                </span>
              )}
              {!isLast && <span style={{color:'#bbb'}} aria-hidden="true">›</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
