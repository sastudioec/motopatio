import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/listings/draft/[id]
 *
 * Devuelve un borrador del usuario para pre-llenar el formulario
 * de /publicar. Solo funciona si el Listing pertenece al usuario
 * y esta en estado 'borrador'.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true, userId: true, estado: true, planId: true, planTipo: true,
      marca: true, modelo: true, anio: true, cilindraje: true, tipo: true,
      km: true, precio: true, provincia: true, ciudad: true, color: true, placa: true,
      descripcion: true, fotos: true, esElectrica: true,
    },
  })

  if (!listing) {
    return NextResponse.json({ error: 'Borrador no encontrado' }, { status: 404 })
  }
  if (listing.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (listing.estado !== 'borrador') {
    return NextResponse.json({ error: 'Esta publicacion ya no es un borrador' }, { status: 400 })
  }

  let fotosArr: string[] = []
  try {
    fotosArr = listing.fotos ? JSON.parse(listing.fotos) : []
  } catch {
    fotosArr = []
  }

  return NextResponse.json({
    ok: true,
    listingId: listing.id,
    planId: listing.planId,
    draft: {
      marca: listing.marca,
      modelo: listing.modelo,
      anio: listing.anio ? String(listing.anio) : '',
      cilindraje: listing.cilindraje,
      tipo: listing.tipo,
      km: listing.km ? String(listing.km) : '',
      precio: listing.precio ? String(listing.precio) : '',
      provincia: listing.provincia || '',
      ciudad: listing.ciudad,
      color: listing.color || '',
      placa: listing.placa || '',
      descripcion: listing.descripcion || '',
      fotos: Array.isArray(fotosArr) ? fotosArr.filter(f => typeof f === 'string') : [],
      esElectrica: Boolean(listing.esElectrica),
    },
  })
}
