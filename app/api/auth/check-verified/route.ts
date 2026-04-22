import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ verified: false })
  const rows = await prisma.$queryRawUnsafe(
    'SELECT emailVerified FROM User WHERE email = ? LIMIT 1',
    session.user.email
  ) as any[]
  const verified = !!(rows[0]?.emailVerified)
  return NextResponse.json({ verified })
}
