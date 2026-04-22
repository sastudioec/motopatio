import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { user: { select: { name: true, phone: true } } },
  })
  if (!listing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ listing })
}
