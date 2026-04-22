import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ESTADOS_VALIDOS = ['activo', 'suspendido']

// Verifica sesión + ownership
async function verificarDueno(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { error: 'No autorizado', status: 401 }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { error: 'Usuario no encontrado', status: 404 }

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return { error: 'Moto no encontrada', status: 404 }

  if (listing.userId !== user.id) return { error: 'No tienes permiso', status: 403 }

  return { user, listing }
}

// Obtener los datos de MI moto (para editar)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await verificarDueno(id)
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

  return NextResponse.json({ listing: check.listing })
}

// PATCH: cambiar estado O editar campos permitidos (precio, descripcion, km, fotos)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await verificarDueno(id)
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await req.json()
    const data: any = {}

    // Cambio de estado (comportamiento existente)
    if (typeof body.estado === 'string') {
      if (!ESTADOS_VALIDOS.includes(body.estado)) {
        return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
      }
      data.estado = body.estado
    }

    // Edición de campos permitidos
    if (body.precio !== undefined) {
      const p = parseInt(body.precio)
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: 'Precio invalido' }, { status: 400 })
      }
      data.precio = p
    }

    if (body.km !== undefined) {
      const k = parseInt(body.km)
      if (isNaN(k) || k < 0) {
        return NextResponse.json({ error: 'Kilometraje invalido' }, { status: 400 })
      }
      data.km = k
    }

    if (typeof body.descripcion === 'string') {
      data.descripcion = body.descripcion.slice(0, 3000)
    }

    if (Array.isArray(body.fotos)) {
      // Validar que sean URLs razonables
      const fotosLimpias = body.fotos.filter((f: any) => typeof f === 'string' && f.startsWith('http'))
      data.fotos = JSON.stringify(fotosLimpias)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ok: true, listing: updated })
  } catch (e) {
    console.error('PATCH mis-motos error:', e)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE: eliminar la publicacion
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await verificarDueno(id)
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    await prisma.listing.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE mis-motos error:', e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
