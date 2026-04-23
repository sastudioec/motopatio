import { NextResponse } from 'next/server'
import { getActivePlans } from '@/lib/plans'

export async function GET() {
  try {
    const plans = await getActivePlans()
    // 'featured' es un add-on, no parte del catalogo de planes de publicacion.
    // Se consulta directo por id desde /api/pagos/destacar.
    const publicPlans = plans.filter((p) => p.id !== 'featured')
    return NextResponse.json({ plans: publicPlans })
  } catch (e) {
    console.error('Error obteniendo planes:', e)
    return NextResponse.json(
      { error: 'No se pudo obtener el catalogo de planes' },
      { status: 500 }
    )
  }
}
