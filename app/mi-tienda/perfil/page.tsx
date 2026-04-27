import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { prisma } from '@/lib/prisma'
import { getDealerByUserId } from '@/lib/dealers'
import MiTiendaPerfilForm from './MiTiendaPerfilForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar perfil | Mi Tienda | MotoPatio' }

export default async function MiTiendaPerfilPage() {
  if (!dealersEnabled()) notFound()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/auth/login?next=/mi-tienda/perfil')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, blocked: true },
  })
  if (!user || user.blocked) redirect('/auth/login?next=/mi-tienda/perfil')
  // Si el user está logueado pero no es dealer, su perfil vive en /perfil.
  // Mandarlo a /auth/login generaría loop porque ya tiene sesión válida.
  if (user.role !== 'dealer') redirect('/perfil')

  const dealer = await getDealerByUserId(user.id)
  if (!dealer) redirect('/dealers/registro')

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '22px', fontWeight: 900, color: '#1E2340',
            fontFamily: 'Montserrat,sans-serif', margin: '0 0 4px',
          }}>
            Editar perfil — {dealer.nombreComercial}
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
            Estos datos aparecen en tu perfil público.
          </p>
        </header>
        <MiTiendaPerfilForm
          initial={{
            nombreComercial: dealer.nombreComercial,
            descripcion: dealer.descripcion ?? '',
            logo: dealer.logo ?? '',
            bannerImage: dealer.bannerImage ?? '',
            direccion: dealer.direccion ?? '',
            ciudad: dealer.ciudad,
            provincia: dealer.provincia,
            googleMapsUrl: dealer.googleMapsUrl ?? '',
            telefono: dealer.telefono ?? '',
            whatsapp: dealer.whatsapp ?? '',
            emailContacto: dealer.emailContacto ?? '',
            sitioWeb: dealer.sitioWeb ?? '',
            redes: (dealer.redes as Record<string, string> | null) ?? null,
            ruc: dealer.ruc ?? '',
            razonSocial: dealer.razonSocial ?? '',
            slug: dealer.slug,
          }}
        />
      </div>
    </main>
  )
}
