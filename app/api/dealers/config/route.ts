import { NextResponse } from 'next/server'
import { dealersEnabled, dealerPlansEnabled } from '@/lib/dealer-flags'

// Endpoint publico de bajo costo para que componentes client (Navbar)
// sepan si tienen que mostrar CTAs de dealer. No revela informacion
// sensible: solo dos booleanos del estado de las flags.
export async function GET() {
  return NextResponse.json({
    enabled: dealersEnabled(),
    plansEnabled: dealerPlansEnabled(),
  })
}
