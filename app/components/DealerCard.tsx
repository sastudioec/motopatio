import Link from 'next/link'

type DealerCardData = {
  slug: string
  nombreComercial: string
  logo: string | null
  bannerImage: string | null
  ciudad: string
  provincia: string
  verificado: boolean
}

export default function DealerCard({ dealer }: { dealer: DealerCardData }) {
  return (
    <Link href={`/dealers/${dealer.slug}`} style={{
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e0e0e0',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}>
      <div style={{
        height: '120px',
        background: dealer.bannerImage
          ? `url(${dealer.bannerImage}) center/cover`
          : 'linear-gradient(135deg, #1E2340 0%, #2a3260 100%)',
      }} />
      <div style={{ padding: '16px', position: 'relative' }}>
        {dealer.logo && (
          <div style={{
            position: 'absolute',
            top: '-32px',
            left: '16px',
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            background: '#fff',
            border: '3px solid #fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            <img
              src={dealer.logo}
              alt={dealer.nombreComercial}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
        <div style={{ marginTop: dealer.logo ? '40px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: '#1E2340',
              fontFamily: 'Montserrat,sans-serif',
            }}>
              {dealer.nombreComercial}
            </h3>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            📍 {dealer.ciudad}, {dealer.provincia}
          </div>
        </div>
      </div>
    </Link>
  )
}
