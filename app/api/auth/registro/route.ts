import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/emails'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password)
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists)
      return NextResponse.json({ error: 'Este correo ya esta registrado' }, { status: 409 })
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name, email,
        password: hashedPassword,
        role: 'user',
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    })
    await sendVerificationEmail(email, name, verifyToken)
    return NextResponse.json({ message: 'Cuenta creada. Revisa tu correo para verificar.', userId: user.id })
  } catch (error) {
    console.error('Error registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
