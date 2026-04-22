import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ exists: false })
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, image: true }
    })
    if (!user) return NextResponse.json({ exists: false })
    const isGoogleOnly = !user.password && !!user.image
    return NextResponse.json({ exists: true, isGoogleOnly })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
