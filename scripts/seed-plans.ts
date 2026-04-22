import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLANES = [
  {
    id: 'gratis',
    name: 'Gratis',
    priceCents: 0,
    durationDays: 5,
    maxPhotos: 4,
    featuredDays: 0,
    cooldownDays: 30,
    isActive: true,
    sortOrder: 1,
    description: 'Publicacion gratuita por 5 dias. Un anuncio cada 30 dias por usuario.',
  },
  {
    id: 'basico',
    name: 'Basico',
    priceCents: 500,
    durationDays: 15,
    maxPhotos: 8,
    featuredDays: 0,
    cooldownDays: 0,
    isActive: true,
    sortOrder: 2,
    description: 'Publicacion por 15 dias con 8 fotos y estadisticas basicas.',
  },
  {
    id: 'full',
    name: 'Full',
    priceCents: 1000,
    durationDays: 30,
    maxPhotos: 15,
    featuredDays: 7,
    cooldownDays: 0,
    isActive: true,
    sortOrder: 3,
    description: 'Publicacion por 30 dias con 15 fotos, destacado 7 dias y estadisticas completas.',
  },
]

async function main() {
  for (const p of PLANES) {
    const saved = await prisma.plan.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    })
    console.log('Plan listo:', saved.id, '-', saved.name, '- $' + (saved.priceCents / 100).toFixed(2))
  }

  const total = await prisma.plan.count()
  console.log('')
  console.log('Total de planes en BD:', total)
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
