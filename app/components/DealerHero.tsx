type DealerHeroData = {
  nombreComercial: string
  logo: string | null
  bannerImage: string | null
  ciudad: string
  provincia: string
  verificado: boolean
}

/**
 * Header del perfil publico de un dealer. Replica la arquitectura del
 * Banner de /motos: maxWidth 1100, padding horizontal responsive,
 * aspectRatio 4:1 fijo (escalado proporcional desde 1920 hasta 375 sin
 * recorte feo). Logo + datos en una card separada debajo, no flotando.
 */
export default function DealerHero({ dealer }: { dealer: DealerHeroData }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 0' }}>
        <div style={{
          width: '100%',
          aspectRatio: '4/1',
          background: dealer.bannerImage
            ? `url(${dealer.bannerImage}) center/cover`
            : 'linear-gradient(135deg, #1E2340 0%, #2a3260 100%)',
          borderRadius: '6px',
          overflow: 'hidden',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 0 24px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 'clamp(72px, 12vw, 96px)',
            height: 'clamp(72px, 12vw, 96px)',
            borderRadius: '10px',
            background: '#fff',
            border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            marginTop: 'clamp(-40px, -6vw, -56px)',
          }}>
            {dealer.logo ? (
              <img
                src={dealer.logo}
                alt={dealer.nombreComercial}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1E2340', color: '#fff',
                fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900,
              }}>
                {dealer.nombreComercial.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(20px, 3.2vw, 28px)',
                fontWeight: 900,
                color: '#1E2340',
                fontFamily: 'Montserrat,sans-serif',
                lineHeight: 1.2,
              }}>
                {dealer.nombreComercial}
              </h1>
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              📍 {dealer.ciudad}, {dealer.provincia}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
