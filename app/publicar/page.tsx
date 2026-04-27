import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PublicarClient from './PublicarClient'
import PublicarDealerClient from './PublicarDealerClient'
import PublicarDealerRejected from './PublicarDealerRejected'

export const metadata: Metadata = {
  title: 'Publica tu moto en venta',
  description:
    'Publica tu moto en MotoPatío y llega a miles de compradores en Ecuador. Plan gratis disponible o planes pagados con más fotos y destacado.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://motopatio.com/publicar' },
}

export const dynamic = 'force-dynamic'

export default async function PublicarPage() {
  // Si el user es dealer, salteamos el selector de planes y vamos directo
  // al formulario. Para dealer rejected mostramos un bloqueo claro.
  const session = await getServerSession(authOptions)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        dealer: { select: { id: true, approvalStatus: true, nombreComercial: true } },
      },
    })
    if (user?.role === 'dealer' && user.dealer) {
      if (user.dealer.approvalStatus === 'rejected') {
        return <PublicarDealerRejected />
      }
      return <PublicarDealerClient dealerApproved={user.dealer.approvalStatus === 'approved'} />
    }
  }
  return <PublicarClient />
}
