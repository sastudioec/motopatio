const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const drafts = await prisma.listing.findMany({
    where: { estado: 'borrador' },
    select: {
      id: true, marca: true, modelo: true, ciudad: true,
      planId: true, precio: true, km: true, anio: true,
      createdAt: true, userId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  console.log('Borradores recientes:')
  console.log(JSON.stringify(drafts, null, 2))
}
main().finally(() => prisma.$disconnect())
