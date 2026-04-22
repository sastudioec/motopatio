import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const today = new Date()
  today.setHours(0,0,0,0)
  const [totalUsuarios, totalMotos, motosActivas, motosHoy] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { estado: 'activo' } }),
    prisma.listing.count({ where: { createdAt: { gte: today } } }),
  ])
  return NextResponse.json({ totalUsuarios, totalMotos, motosActivas, motosHoy })
}
