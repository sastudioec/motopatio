import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/catalog/brands
 * Devuelve todas las marcas activas ordenadas por sortOrder y nombre.
 */
export async function GET() {
  const all = await prisma.motoBrand.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, sortOrder: true },
    orderBy: { name: 'asc' },
  })
  // "Otra" siempre al final de la lista
  const otras = all.filter(b => b.name.toLowerCase() === 'otra')
  const resto = all.filter(b => b.name.toLowerCase() !== 'otra')
  const brands = [...resto, ...otras]
  return NextResponse.json({ ok: true, brands })
}
