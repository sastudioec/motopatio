import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
// Permitir payloads razonables para imágenes
export const maxDuration = 30

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 3 * 1024 * 1024 // 3 MB

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido (solo jpg/png/webp/gif)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Archivo muy grande (máximo 3 MB)' }, { status: 400 })
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${crypto.randomBytes(12).toString('hex')}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'banners')

  await fs.mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  const publicUrl = `/banners/${filename}`
  return NextResponse.json({ url: publicUrl })
}
