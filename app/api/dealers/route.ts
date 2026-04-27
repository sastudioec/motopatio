import { NextRequest, NextResponse } from 'next/server'
import { dealersEnabled } from '@/lib/dealer-flags'
import { listDealersPublic } from '@/lib/dealers'

export async function GET(req: NextRequest) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { searchParams } = new URL(req.url)
  const ciudad = searchParams.get('ciudad') || undefined
  const verificadosOnly = searchParams.get('verificados') === 'true'
  const dealers = await listDealersPublic({
    ciudad: ciudad && ciudad !== 'todas' ? ciudad : undefined,
    verificadosOnly,
  })
  return NextResponse.json({ dealers })
}
