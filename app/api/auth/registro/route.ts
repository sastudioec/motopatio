import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail, notifyAdmin } from '@/lib/emails'
import { getCiudadesByProvincia } from '@/lib/provincias-ecuador'

export async function POST(request: Request) {
  try {
    const { name, email, password, ciudad, provincia } = await request.json()
    if (!name || !email || !password)
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 })

    // Validacion de combo provincia/ciudad: si ambos vienen, ciudad debe pertenecer
    // a la provincia. Tolerante a null/undefined (ambos opcionales en la DB).
    if (ciudad && provincia) {
      const ciudadesValidas = getCiudadesByProvincia(provincia)
      if (!ciudadesValidas.includes(ciudad)) {
        return NextResponse.json(
          { error: 'Ciudad no pertenece a la provincia seleccionada' },
          { status: 400 }
        )
      }
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists)
      return NextResponse.json({ error: 'Este correo ya esta registrado' }, { status: 409 })
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name, email,
        ciudad: ciudad || null,
        provincia: provincia || null,
        password: hashedPassword,
        role: 'user',
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    })
    await sendVerificationEmail(email, name, verifyToken)

    // Notificar al admin igual que el flow de Google OAuth (lib/auth.ts).
    // Fire-and-forget: si falla el correo, no rompemos la creación del user.
    try {
      const nombre = name || 'usuario'
      const adminBody = '<h3>Nuevo usuario</h3><ul>'
        + '<li><strong>Nombre:</strong> ' + nombre + '</li>'
        + '<li><strong>Email:</strong> ' + email + '</li>'
        + '<li><strong>Provider:</strong> credentials (email/password)</li>'
        + '<li><strong>Verificado:</strong> pendiente</li>'
        + '</ul>'
      await notifyAdmin('[MotoPatio][Usuario] Nuevo: ' + nombre + ' (' + email + ')', adminBody)
    } catch (e) {
      console.error('[notifyAdmin] usuario credentials:', e)
    }

    return NextResponse.json({ message: 'Cuenta creada. Revisa tu correo para verificar.', userId: user.id })
  } catch (error) {
    console.error('Error registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
