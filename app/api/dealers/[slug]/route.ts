import { NextRequest, NextResponse } from 'next/server'
import { dealersEnabled } from '@/lib/dealer-flags'
import { getDealerBySlug } from '@/lib/dealers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { slug } = await params
  const dealer = await getDealerBySlug(slug)
  // 404 tambien si esta pendiente de aprobacion o rechazado
  if (!dealer || !dealer.activo || dealer.approvalStatus !== 'approved') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // No exponemos datos privados (ruc, razonSocial, userId, subscription*).
  return NextResponse.json({
    dealer: {
      id: dealer.id,
      slug: dealer.slug,
      nombreComercial: dealer.nombreComercial,
      descripcion: dealer.descripcion,
      logo: dealer.logo,
      bannerImage: dealer.bannerImage,
      direccion: dealer.direccion,
      ciudad: dealer.ciudad,
      provincia: dealer.provincia,
      googleMapsUrl: dealer.googleMapsUrl,
      telefono: dealer.telefono,
      whatsapp: dealer.whatsapp,
      emailContacto: dealer.emailContacto,
      sitioWeb: dealer.sitioWeb,
      redes: dealer.redes,
      verificado: dealer.verificado,
      createdAt: dealer.createdAt,
    },
  })
}
