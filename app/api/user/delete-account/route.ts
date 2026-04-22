import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { confirmText } = await req.json()
  if (confirmText !== 'ELIMINAR') {
    return NextResponse.json({ error: 'Debes escribir ELIMINAR para confirmar' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Borrar pagos primero (FK hacia listing y user)
  await prisma.payment.deleteMany({ where: { userId: user.id } })
  await prisma.listing.deleteMany({ where: { userId: user.id } })
  await prisma.account.deleteMany({ where: { userId: user.id } })
  await prisma.session.deleteMany({ where: { userId: user.id } })
  await prisma.user.delete({ where: { id: user.id } })

  return NextResponse.json({ ok: true })
}
