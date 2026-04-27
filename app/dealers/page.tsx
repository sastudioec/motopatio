import { notFound } from 'next/navigation'
import { dealersEnabled } from '@/lib/dealer-flags'
import { listDealersPublic } from '@/lib/dealers'
import Banner from '@/app/components/Banner'
import DealersDirectoryClient from './DealersDirectoryClient'

export const metadata = {
  title: 'Concesionarios de motos en Ecuador | MotoPatio',
  description: 'Directorio de concesionarios y patios de motos en Ecuador. Encuentra tu próxima moto en tiendas de confianza.',
}

export const dynamic = 'force-dynamic'

export default async function DealersPage() {
  if (!dealersEnabled()) notFound()

  const dealers = await listDealersPublic()
  const ciudadesSet = new Set(dealers.map((d) => d.ciudad))
  const ciudades = Array.from(ciudadesSet).sort()

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh' }}>
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
        {/* Banner hero del directorio de concesionarios */}
        <div style={{ marginBottom: '20px' }}>
          <Banner position="dealers_hero" aspectRatio="4/1" />
        </div>

        <header style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '32px', fontWeight: 900, color: '#1E2340',
            fontFamily: 'Montserrat,sans-serif', margin: '0 0 8px',
          }}>
            Concesionarios
          </h1>
          <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
            {dealers.length} {dealers.length === 1 ? 'tienda' : 'tiendas'} en MotoPatio.
          </p>
        </header>

        <DealersDirectoryClient
          initialDealers={dealers as any}
          ciudades={ciudades}
          adSlots={
            <>
              <Banner position="dealers_mid_left" aspectRatio="4/1" />
              <Banner position="dealers_mid_right" aspectRatio="4/1" />
            </>
          }
        />
      </div>
    </main>
  )
}
