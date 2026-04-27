import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { dateRangeWhereCreatedAt } from '@/lib/date-range'

function csvCell(v: any): string {
  if (v == null) return ''
  const s = String(v).replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  const fin = searchParams.get('financiamiento')
  const where: any = {
    ...dateRangeWhereCreatedAt({
      desde: searchParams.get('desde'),
      hasta: searchParams.get('hasta'),
    }),
  }
  if (tipo === 'dealer') where.listingOwnerType = 'dealer'
  if (tipo === 'user') where.listingOwnerType = 'user'
  if (fin === 'si') where.interesadoFinanciamiento = true
  if (fin === 'no') where.interesadoFinanciamiento = false

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { marca: true, modelo: true, anio: true, slug: true } },
      dealer: { select: { nombreComercial: true, slug: true } },
    },
  })

  const header = ['fecha', 'tipo', 'nombre', 'telefono', 'ciudad', 'financiamiento', 'moto', 'dealer', 'listing_url']
  const rows = leads.map(l => [
    l.createdAt.toISOString(),
    l.listingOwnerType,
    l.nombre,
    l.telefono,
    l.ciudad ?? '',
    l.interesadoFinanciamiento ? 'si' : 'no',
    l.listing ? `${l.listing.marca} ${l.listing.modelo} ${l.listing.anio}` : '',
    l.dealer?.nombreComercial ?? '',
    l.listing?.slug ? `https://motopatio.com/motos/${l.listing.slug}` : '',
  ])
  // BOM UTF-8 para que Excel respete tildes y enies.
  const csv = '﻿' + [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
