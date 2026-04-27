import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { isSlugAvailable } from '@/lib/dealers'

export async function POST(req: NextRequest) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const slug = String(body?.slug ?? '').trim().toLowerCase()
  if (!slug) {
    return NextResponse.json({ available: false, reason: 'empty' })
  }
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3 || slug.length > 60) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }
  const available = await isSlugAvailable(slug)
  return NextResponse.json({ available, reason: available ? null : 'taken' })
}
