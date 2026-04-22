import { NextResponse } from 'next/server'
import { getActivePlans } from '@/lib/plans'

export async function GET() {
  try {
    const plans = await getActivePlans()
    return NextResponse.json({ plans })
  } catch (e) {
    console.error('Error obteniendo planes:', e)
    return NextResponse.json(
      { error: 'No se pudo obtener el catalogo de planes' },
      { status: 500 }
    )
  }
}
