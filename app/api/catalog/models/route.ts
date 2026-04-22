import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/catalog/models?brandId=xxx
 * Devuelve los modelos de una marca, con "Otro" siempre al final.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandId = searchParams.get('brandId')
  if (!brandId) {
    return NextResponse.json({ error: 'Falta brandId' }, { status: 400 })
  }

  const models = await prisma.motoModel.findMany({
    where: { brandId, active: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  // Asegurar que "Otro" quede al final de la lista
  const otros = models.filter(m => m.name.toLowerCase() === 'otro')
  const resto = models.filter(m => m.name.toLowerCase() !== 'otro')
  const sorted = [...resto, ...otros]

  return NextResponse.json({ ok: true, models: sorted })
}
