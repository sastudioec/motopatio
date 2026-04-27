import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type RequireDealerResult =
  | { ok: true; userId: string; dealerId: string }
  | { ok: false; status: number; error: string }

export async function requireDealer(): Promise<RequireDealerResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { ok: false, status: 401, error: 'No autorizado' }
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      role: true,
      blocked: true,
      dealer: { select: { id: true, activo: true } },
    },
  })
  if (!user || user.blocked) {
    return { ok: false, status: 403, error: 'No autorizado' }
  }
  if (user.role !== 'dealer') {
    return { ok: false, status: 403, error: 'No autorizado' }
  }
  if (!user.dealer || !user.dealer.activo) {
    return { ok: false, status: 403, error: 'Dealer inactivo' }
  }
  return { ok: true, userId: user.id, dealerId: user.dealer.id }
}
