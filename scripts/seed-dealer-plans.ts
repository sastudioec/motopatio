import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLANES_DEALER = [
  {
    id: 'dealer_starter',
    name: 'Dealer Starter',
    priceCents: 2900,
    durationDays: 30,
    maxListings: 8,
    maxFeaturedListings: 0,
    includesPriorityListing: false,
    includesAnalytics: false,
    isActive: true,
    sortOrder: 1,
    description: 'Plan inicial para concesionarios pequenos. Hasta 8 anuncios activos. Renovacion manual cada 30 dias.',
  },
  {
    id: 'dealer_pro',
    name: 'Dealer Pro',
    priceCents: 7900,
    durationDays: 30,
    maxListings: 25,
    maxFeaturedListings: 3,
    includesPriorityListing: false,
    includesAnalytics: true,
    isActive: true,
    sortOrder: 2,
    description: 'Para concesionarios establecidos. 25 anuncios activos, 3 destacados incluidos y analytics. Renovacion manual cada 30 dias.',
  },
  {
    id: 'dealer_premium',
    name: 'Dealer Premium',
    priceCents: 17900,
    durationDays: 30,
    maxListings: 999,
    maxFeaturedListings: 999,
    includesPriorityListing: true,
    includesAnalytics: true,
    isActive: true,
    sortOrder: 3,
    description: 'Sin limites practicos. Todos los anuncios destacados, listing prioritario en busquedas y analytics completo. Renovacion manual cada 30 dias.',
  },
]

async function main() {
  for (const p of PLANES_DEALER) {
    const saved = await prisma.dealerPlan.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    })
    console.log('DealerPlan listo:', saved.id, '-', saved.name, '- $' + (saved.priceCents / 100).toFixed(2) + '/mes')
  }

  const total = await prisma.dealerPlan.count()
  console.log('')
  console.log('Total de planes de dealer en BD:', total)
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
