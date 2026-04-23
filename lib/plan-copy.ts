/**
 * Fuente unica de copy visible de un Plan. Consumido por /publicar y
 * /precios. Portable client-side: no importa tipos de Prisma.
 */

export type PlanForCopy = {
  id: string
  name: string
  priceCents: number
  durationDays: number
  maxPhotos: number
  featuredDays: number
  cooldownDays: number
}

export type PlanCopy = {
  features: string[]
  noFeatures: string[]
  badge: string | null
}

export function getPlanCopy(plan: PlanForCopy): PlanCopy {
  if (plan.id === 'gratis') {
    return {
      features: [
        `1 anuncio gratis cada ${plan.cooldownDays} días`,
        `${plan.durationDays} días de publicación`,
        `Hasta ${plan.maxPhotos} fotos`,
        'Visible en catálogo',
      ],
      noFeatures: ['Sin destacado', 'Sin renovación automática'],
      badge: null,
    }
  }
  if (plan.id === 'basico') {
    return {
      features: [
        `${plan.durationDays} días de publicación`,
        `Hasta ${plan.maxPhotos} fotos`,
        'Visible en catálogo',
        'Pago único por publicación',
      ],
      noFeatures: ['Sin destacado'],
      badge: null,
    }
  }
  if (plan.id === 'full') {
    const destacado =
      plan.featuredDays > 0
        ? [`Destacado por ${plan.featuredDays} días`, 'Aparece primero']
        : []
    return {
      features: [
        `${plan.durationDays} días de publicación`,
        `Hasta ${plan.maxPhotos} fotos`,
        ...destacado,
        'Pago único por publicación',
      ],
      noFeatures: [],
      badge: 'Más popular',
    }
  }
  return {
    features: [
      `${plan.durationDays} días de publicación`,
      `Hasta ${plan.maxPhotos} fotos`,
    ],
    noFeatures: [],
    badge: null,
  }
}

export function getPlanCtaLabel(plan: PlanForCopy): string {
  if (plan.priceCents === 0) return 'Elegir gratis'
  return 'Elegir ' + plan.name
}
