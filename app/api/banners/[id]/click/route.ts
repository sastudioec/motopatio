import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { linkUrl: true },
  })

  if (!banner || !banner.linkUrl) {
    return NextResponse.redirect(new URL('/', _req.url))
  }

  // Registrar click asíncrono (no bloquea el redirect)
  prisma.bannerClick.create({ data: { bannerId: id } })
    .catch(err => console.error('Error registrando click:', err))

  return NextResponse.redirect(banner.linkUrl)
}
