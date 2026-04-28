import { NextRequest, NextResponse } from 'next/server'
import { dealersEnabled } from '@/lib/dealer-flags'
import { requireDealer } from '@/lib/dealer-auth'
import { prisma } from '@/lib/prisma'
import { dateRangeWhereCreatedAt } from '@/lib/date-range'
import { formatFechaCortaHora } from '@/lib/format-date'

function csvCell(v: any): string {
  if (v == null) return ''
  const s = String(v).replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}

export async function GET(req: NextRequest) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const auth = await requireDealer()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const dealer = await prisma.dealer.findUnique({
    where: { id: auth.dealerId },
    select: { slug: true },
  })
  if (!dealer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const dateRange = dateRangeWhereCreatedAt({
    desde: searchParams.get('desde'),
    hasta: searchParams.get('hasta'),
  })

  const leads = await prisma.lead.findMany({
    where: { dealerId: auth.dealerId, ...dateRange },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { marca: true, modelo: true, anio: true, slug: true } },
    },
  })

  const header = ['Fecha', 'Nombre', 'Teléfono', 'Ciudad', 'Moto', 'Link', 'Financiamiento']
  const rows = leads.map((l) => [
    formatFechaCortaHora(l.createdAt),
    l.nombre,
    l.telefono,
    l.ciudad ?? '',
    l.listing ? `${l.listing.marca} ${l.listing.modelo} ${l.listing.anio}` : '',
    l.listing?.slug ? `https://motopatio.com/motos/${l.listing.slug}` : '',
    l.interesadoFinanciamiento ? 'Sí' : 'No',
  ])
  // BOM UTF-8 para que Excel respete tildes y enies.
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')

  const date = new Date().toISOString().slice(0, 10)
  const filename = `leads-motopatio-${dealer.slug}-${date}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
