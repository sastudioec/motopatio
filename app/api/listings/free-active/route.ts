import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFreePlanState } from '@/lib/plans'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const state = await getFreePlanState(user.id)
  return NextResponse.json({
    hasFreeActive: state.hasFreeActive,
    cooldownUntil: state.cooldownUntil,
    daysRemaining: state.daysRemaining,
  })
}
