import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    // resource_type:'auto' detecta el tipo (image / raw / video). Sin esto,
    // Cloudinary trata todo como imagen y rechaza PDFs con 400, lo que dejaba
    // el wizard de dealer trabado al subir el documento de verificacion.
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'motopatio', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })
    const r = result as any
    return NextResponse.json({
      url: r.secure_url,
      resourceType: r.resource_type,
      format: r.format,
    })
  } catch (err: any) {
    console.error('Cloudinary upload failed', err)
    return NextResponse.json({ error: 'No se pudo subir la imagen' }, { status: 500 })
  }
}
