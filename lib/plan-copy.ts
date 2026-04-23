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

export type PlanFeature = {
  text: string
  highlight?: boolean
}

export type PlanCopy = {
  features: PlanFeature[]
  noFeatures: string[]
  badge: string | null
}

export function getPlanCopy(plan: PlanForCopy): PlanCopy {
  if (plan.id === 'gratis') {
    return {
      features: [
        { text: `1 anuncio gratis cada ${plan.cooldownDays} días` },
        { text: `${plan.durationDays} días de publicación` },
        { text: `Hasta ${plan.maxPhotos} fotos` },
        { text: 'Visible en catálogo' },
      ],
      noFeatures: ['Sin destacado', 'Sin renovación automática'],
      badge: null,
    }
  }
  if (plan.id === 'basico') {
    return {
      features: [
        { text: `${plan.durationDays} días de publicación` },
        { text: `Hasta ${plan.maxPhotos} fotos` },
        { text: 'Visible en catálogo' },
        { text: 'Pago único por publicación' },
      ],
      noFeatures: ['Sin destacado'],
      badge: null,
    }
  }
  if (plan.id === 'full') {
    const destacado: PlanFeature[] =
      plan.featuredDays > 0
        ? [{ text: `⭐ Destacado ${plan.featuredDays} días incluido`, highlight: true }]
        : []
    return {
      features: [
        { text: `${plan.durationDays} días de publicación` },
        { text: `Hasta ${plan.maxPhotos} fotos` },
        ...destacado,
        { text: 'Pago único por publicación' },
      ],
      noFeatures: [],
      badge: 'Más popular',
    }
  }
  return {
    features: [
      { text: `${plan.durationDays} días de publicación` },
      { text: `Hasta ${plan.maxPhotos} fotos` },
    ],
    noFeatures: [],
    badge: null,
  }
}

export function getPlanCtaLabel(plan: PlanForCopy): string {
  if (plan.priceCents === 0) return 'Elegir gratis'
  return 'Elegir ' + plan.name
}
