import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dealersEnabled } from '@/lib/dealer-flags'
import { createDealer, isValidRucFormat } from '@/lib/dealers'
import { sendDealerWelcomeEmail, notifyAdmin } from '@/lib/emails'

export async function POST(req: NextRequest) {
  if (!dealersEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, blocked: true, email: true },
  })
  if (!user || user.blocked) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (user.role !== 'user') {
    return NextResponse.json({ error: 'Tu cuenta no puede registrarse como concesionario' }, { status: 409 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }

  // Todos los campos del wizard son obligatorios excepto sitioWeb e
  // Instagram/Facebook/TikTok (que entran dentro de body.redes y no aplican aca).
  const required = [
    'nombreComercial', 'slug', 'descripcion',
    'provincia', 'ciudad', 'direccion', 'googleMapsUrl',
    'telefono', 'whatsapp', 'emailContacto',
    'ruc', 'razonSocial',
    'logo', 'bannerImage', 'documentoVerificacion',
  ] as const
  for (const f of required) {
    if (!body[f] || typeof body[f] !== 'string' || !body[f].trim()) {
      return NextResponse.json({ error: `Falta el campo ${f}` }, { status: 400 })
    }
  }
  if (!isValidRucFormat(body.ruc)) {
    return NextResponse.json({ error: 'RUC debe tener 13 digitos' }, { status: 400 })
  }
  if (typeof body.descripcion === 'string' && body.descripcion.length > 1000) {
    return NextResponse.json({ error: 'Descripcion supera 1000 caracteres' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(body.slug) || body.slug.length < 3 || body.slug.length > 60) {
    return NextResponse.json({ error: 'Slug invalido' }, { status: 400 })
  }

  try {
    const dealer = await createDealer({
      userId: user.id,
      nombreComercial: body.nombreComercial.trim(),
      slug: body.slug.trim().toLowerCase(),
      descripcion: body.descripcion?.trim() || null,
      ciudad: body.ciudad.trim(),
      provincia: body.provincia.trim(),
      direccion: body.direccion?.trim() || null,
      googleMapsUrl: body.googleMapsUrl?.trim() || null,
      telefono: body.telefono?.trim() || null,
      whatsapp: body.whatsapp?.trim() || null,
      emailContacto: body.emailContacto?.trim() || null,
      sitioWeb: body.sitioWeb?.trim() || null,
      redes: body.redes && typeof body.redes === 'object' ? body.redes : null,
      ruc: body.ruc.trim(),
      razonSocial: body.razonSocial.trim(),
      logo: body.logo,
      bannerImage: body.bannerImage || null,
      documentoVerificacion: body.documentoVerificacion,
    })

    // Email al dealer (no bloqueante)
    if (user.email && dealer.trialEndsAt) {
      sendDealerWelcomeEmail(user.email, {
        nombreComercial: dealer.nombreComercial,
        slug: dealer.slug,
        trialEndsAt: dealer.trialEndsAt,
      }).catch((e) => console.error('[dealer welcome email]', e))
    }
    // Notificacion a admin para que revise verificacion (no bloqueante)
    const adminBody =
      '<h3>Nuevo concesionario pendiente de verificacion</h3>' +
      '<ul>' +
      '<li><strong>Nombre:</strong> ' + dealer.nombreComercial + '</li>' +
      '<li><strong>Slug:</strong> ' + dealer.slug + '</li>' +
      '<li><strong>RUC:</strong> ' + dealer.ruc + '</li>' +
      '<li><strong>Ciudad:</strong> ' + dealer.ciudad + ' (' + dealer.provincia + ')</li>' +
      '<li><strong>Email cuenta:</strong> ' + (user.email || '-') + '</li>' +
      '<li><strong>Documento:</strong> <a href="' + body.documentoVerificacion + '">ver</a></li>' +
      '</ul>'
    notifyAdmin('[MotoPatio][Dealer] Nuevo: ' + dealer.nombreComercial, adminBody).catch((e) =>
      console.error('[notifyAdmin dealer]', e)
    )

    return NextResponse.json({
      ok: true,
      dealer: { id: dealer.id, slug: dealer.slug },
    })
  } catch (e: any) {
    if (e?.message === 'SLUG_TAKEN') {
      return NextResponse.json({ error: 'Ese slug ya esta en uso' }, { status: 409 })
    }
    if (e?.message === 'RUC_TAKEN') {
      return NextResponse.json({ error: 'Ese RUC ya esta registrado' }, { status: 409 })
    }
    console.error('[POST /api/dealers/registro]', e)
    return NextResponse.json({ error: 'No se pudo registrar el concesionario' }, { status: 500 })
  }
}
