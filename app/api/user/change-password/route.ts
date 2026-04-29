import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { currentPassword, newPassword } = await req.json()
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  if (!user.password) {
    return NextResponse.json({ error: 'Tu cuenta usa Google. La contraseña se gestiona desde Google.' }, { status: 400 })
  }
  const valid = await bcrypt.compare(currentPassword || '', user.password)
  if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
  const isSame = await bcrypt.compare(newPassword, user.password)
  if (isSame) return NextResponse.json({ error: 'La nueva contraseña no puede ser igual a la actual' }, { status: 400 })
  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  return NextResponse.json({ ok: true })
}
