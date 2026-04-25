import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail, notifyAdmin } from '@/lib/emails'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect('https://motopatio.com/auth/login?error=token_invalido')
    }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, email, name, emailVerifyExpires FROM User WHERE emailVerifyToken = ? LIMIT 1`,
      token
    ) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.redirect('https://motopatio.com/auth/login?error=token_expirado')
    }

    const user = rows[0]

    if (user.emailVerifyExpires && new Date(user.emailVerifyExpires) < new Date()) {
      return NextResponse.redirect('https://motopatio.com/auth/login?error=token_expirado')
    }

    await prisma.$executeRawUnsafe(
      `UPDATE User SET emailVerified = NOW(), emailVerifyToken = NULL, emailVerifyExpires = NULL WHERE id = ?`,
      user.id
    )

    try {
      await sendWelcomeEmail(user.email, user.name || 'usuario')
    } catch(e) {
      console.error('Welcome email error:', e)
    }

    try {
      const nombre = user.name || 'usuario'
      const adminBody = '<h3>Nuevo usuario verificado</h3><ul>'
        + '<li><strong>Nombre:</strong> ' + nombre + '</li>'
        + '<li><strong>Email:</strong> ' + user.email + '</li>'
        + '<li><strong>Provider:</strong> credentials</li>'
        + '<li><strong>Verificado:</strong> sí</li>'
        + '</ul>'
      await notifyAdmin('[MotoPatio][Usuario] Nuevo: ' + nombre + ' (' + user.email + ')', adminBody)
    } catch (e) {
      console.error('[notifyAdmin] usuario credentials:', e)
    }

    return NextResponse.redirect('https://motopatio.com/auth/login?verified=1')

  } catch(e) {
    console.error('Verify email error:', e)
    return NextResponse.redirect('https://motopatio.com/auth/login?error=token_invalido')
  }
}
