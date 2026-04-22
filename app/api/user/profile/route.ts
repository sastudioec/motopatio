import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, name: true, lastName: true, email: true, phone: true,
      city: true, bio: true, avatar: true, gender: true, birthDate: true,
      phoneVerified: true, cedulaVerified: true, createdAt: true,
      password: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  const hasPassword = !!user.password
  const { password, ...safeUser } = user
  return NextResponse.json({ user: { ...safeUser, hasPassword } })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { name, lastName, phone, city, bio, gender, birthDate, avatar } = body
  const data: any = {}
  if (name !== undefined) data.name = name
  if (lastName !== undefined) data.lastName = lastName
  if (phone !== undefined) data.phone = phone
  if (city !== undefined) data.city = city
  if (bio !== undefined) data.bio = bio
  if (gender !== undefined) data.gender = gender
  if (avatar !== undefined) data.avatar = avatar
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data,
  })
  return NextResponse.json({ ok: true, user: { id: updated.id, name: updated.name } })
}
