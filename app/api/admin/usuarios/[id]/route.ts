import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  await prisma.user.update({ where: { id }, data: { blocked: body.blocked } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { id } = await params
  await prisma.listing.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
