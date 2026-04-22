import { prisma } from './prisma'

export type BannerPosition =
  | 'hero' | 'mid_left' | 'mid_right'
  | 'motos_hero' | 'motos_mid_left' | 'motos_mid_right'

/**
 * Elige aleatoriamente un banner activo para la posición dada y
 * registra la impresión en la BD. Devuelve null si no hay banners activos.
 */
export async function pickBanner(position: BannerPosition) {
  const now = new Date()

  const candidates = await prisma.banner.findMany({
    where: {
      position,
      active: true,
      startDate: { lte: now },
      endDate:   { gte: now },
    },
    select: { id: true, imageUrl: true, linkUrl: true, title: true },
  })

  if (candidates.length === 0) return null

  const picked = candidates[Math.floor(Math.random() * candidates.length)]

  // Registrar impresión de forma asíncrona, sin bloquear el render.
  // Si falla por cualquier razón, no queremos romper la página.
  prisma.bannerImpression.create({ data: { bannerId: picked.id } })
    .catch(err => console.error('Error registrando impresión:', err))

  return picked
}
