import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: 'No autorizado' }
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  })
  if (user?.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'No autorizado' }
  }
  return { ok: true as const, userId: user.id }
}
