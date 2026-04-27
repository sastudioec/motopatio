import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { prisma } from '@/lib/prisma'
import RegistroClient from './RegistroClient'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta gratis en MotoPatío y publica tu moto en Ecuador.',
  robots: { index: false, follow: true },
}

export const dynamic = 'force-dynamic'

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>
}) {
  const sp = await searchParams
  const enabled = dealersEnabled()
  const wantsDealer = enabled && sp.as === 'dealer'

  // Si ya hay sesion y querian registrarse como dealer, salteamos el form
  // y los mandamos directo al wizard (o al panel si ya son dealer).
  if (wantsDealer) {
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, blocked: true, dealer: { select: { slug: true } } },
      })
      if (u && !u.blocked) {
        if (u.role === 'user') redirect('/dealers/registro')
        if (u.role === 'dealer') redirect('/mi-tienda')
        // admin: cae al form (el wizard tiene su propio guard)
      }
    }
  }

  const initialAs: 'user' | 'dealer' = wantsDealer ? 'dealer' : 'user'
  return <RegistroClient dealersEnabled={enabled} initialAs={initialAs} />
}
