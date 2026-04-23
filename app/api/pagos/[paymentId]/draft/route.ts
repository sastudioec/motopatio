import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      status: true,
      planId: true,
      metadata: true,
      payphoneRawResponse: true,
    },
  })

  if (!payment) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  }

  if (payment.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (payment.status === 'approved') {
    return NextResponse.json(
      { error: 'Este pago ya fue aprobado. La publicacion ya existe.' },
      { status: 400 }
    )
  }

  let draft: Record<string, unknown> | null = null
  if (payment.metadata && typeof payment.metadata === 'object') {
    const md = payment.metadata as Record<string, unknown>
    if (md.listingDraft && typeof md.listingDraft === 'object') {
      draft = md.listingDraft as Record<string, unknown>
    }
  }
  if (!draft && payment.payphoneRawResponse) {
    try {
      const parsed = JSON.parse(payment.payphoneRawResponse)
      draft = parsed.listingDraft || null
    } catch {
      draft = null
    }
  }

  if (!draft) {
    return NextResponse.json({ error: 'No hay datos guardados de este pago' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    status: payment.status,
    planId: payment.planId,
    draft,
  })
}
