import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { prisma } from '@/lib/prisma'
import { getDealerByUserId, trialDaysRemaining } from '@/lib/dealers'
import { dateRangeWhereCreatedAt } from '@/lib/date-range'
import MiTiendaTabsClient from './MiTiendaTabsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi Tienda | MotoPatio' }

export default async function MiTiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const sp = await searchParams
  if (!dealersEnabled()) notFound()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/auth/login?next=/mi-tienda')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, blocked: true },
  })
  if (!user || user.blocked) redirect('/auth/login?next=/mi-tienda')

  // El JWT puede aun tener role='user' si no hubo relogin tras onboarding;
  // chequeamos contra la BD para evitar bloqueo falso.
  if (user.role !== 'dealer') {
    redirect('/auth/login?next=/mi-tienda')
  }

  const dealer = await getDealerByUserId(user.id)
  if (!dealer) {
    // Esto no deberia pasar si el rol es dealer, pero por seguridad redirigimos
    redirect('/dealers/registro')
  }

  const [verifications, listings, leads] = await Promise.all([
    prisma.dealerVerification.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, documentType: true, status: true, createdAt: true, reviewedAt: true, notes: true },
    }),
    prisma.listing.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lead.findMany({
      where: {
        dealerId: dealer.id,
        ...dateRangeWhereCreatedAt(sp),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { listing: { select: { slug: true, marca: true, modelo: true, anio: true } } },
    }),
  ])

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '24px', fontWeight: 900, color: '#1E2340',
            fontFamily: 'Montserrat,sans-serif', margin: '0 0 4px',
          }}>
            Mi Tienda — {dealer.nombreComercial}
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
            Panel de gestión de tu concesionario.
          </p>
        </header>
        <MiTiendaTabsClient
          dealer={{
            slug: dealer.slug,
            nombreComercial: dealer.nombreComercial,
            verificado: dealer.verificado,
            activo: dealer.activo,
            approvalStatus: dealer.approvalStatus,
            rejectionNotes: dealer.rejectionNotes,
            subscriptionStatus: dealer.subscriptionStatus,
            trialEndsAt: dealer.trialEndsAt ? dealer.trialEndsAt.toISOString() : null,
            trialDaysRemaining: trialDaysRemaining(dealer.trialEndsAt),
          }}
          verifications={verifications.map((v) => ({
            ...v,
            createdAt: v.createdAt.toISOString(),
            reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
          }))}
          listings={listings.map((l) => ({
            id: l.id,
            slug: l.slug,
            marca: l.marca,
            modelo: l.modelo,
            anio: l.anio,
            precio: l.precio,
            estado: l.estado,
            fotos: l.fotos,
            createdAt: l.createdAt.toISOString(),
          }))}
          leads={leads.map((ld) => ({
            id: ld.id,
            nombre: ld.nombre,
            telefono: ld.telefono,
            ciudad: ld.ciudad,
            interesadoFinanciamiento: ld.interesadoFinanciamiento,
            createdAt: ld.createdAt.toISOString(),
            listingTitle: ld.listing ? `${ld.listing.marca} ${ld.listing.modelo} ${ld.listing.anio}` : null,
            listingSlug: ld.listing?.slug ?? null,
          }))}
        />
      </div>
    </main>
  )
}
