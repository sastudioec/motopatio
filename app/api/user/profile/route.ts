import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCiudadesByProvincia } from '@/lib/provincias-ecuador'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, name: true, lastName: true, email: true, phone: true,
      ciudad: true, provincia: true, bio: true, avatar: true, gender: true, birthDate: true,
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
  const { name, lastName, phone, ciudad, provincia, bio, gender, birthDate, avatar } = body

  // Validacion combo provincia/ciudad: si ambos no-vacios, ciudad debe pertenecer
  // a la provincia. Mismo check que /api/auth/registro.
  if (ciudad && provincia) {
    const ciudadesValidas = getCiudadesByProvincia(provincia)
    if (!ciudadesValidas.includes(ciudad)) {
      return NextResponse.json(
        { error: 'Ciudad no pertenece a la provincia seleccionada' },
        { status: 400 }
      )
    }
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (lastName !== undefined) data.lastName = lastName
  if (phone !== undefined) data.phone = phone
  if (ciudad !== undefined) data.ciudad = ciudad || null
  if (provincia !== undefined) data.provincia = provincia || null
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
