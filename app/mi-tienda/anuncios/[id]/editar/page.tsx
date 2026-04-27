import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { prisma } from '@/lib/prisma'
import EditarAnuncioForm from './EditarAnuncioForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar anuncio | Mi Tienda | MotoPatio' }

export default async function EditarAnuncioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!dealersEnabled()) notFound()
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/auth/login?next=/mi-tienda')
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, dealer: { select: { id: true } } },
  })
  if (!user || user.role !== 'dealer') redirect('/auth/login?next=/mi-tienda')

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) notFound()
  if (listing.userId !== user.id) notFound()

  let fotos: string[] = []
  try { fotos = JSON.parse(listing.fotos || '[]') } catch {}

  return (
    <main style={{
      background: '#f7f7f8', minHeight: '60vh',
      padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px)',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 900, color: '#1E2340',
            fontFamily: 'Montserrat,sans-serif', margin: '0 0 4px',
          }}>
            Editar anuncio
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
            {listing.marca} {listing.modelo} {listing.anio}
          </p>
        </header>
        <EditarAnuncioForm
          id={listing.id}
          initial={{
            marca: listing.marca,
            modelo: listing.modelo,
            anio: listing.anio,
            cilindraje: listing.cilindraje,
            tipo: listing.tipo,
            placa: listing.placa,
            ciudad: listing.ciudad,
            provincia: listing.provincia,
            precio: listing.precio,
            km: listing.km,
            descripcion: listing.descripcion ?? '',
            fotos,
            color: listing.color,
            esElectrica: listing.esElectrica,
          }}
        />
      </div>
    </main>
  )
}
