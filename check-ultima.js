const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const last = await prisma.listing.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, marca: true, modelo: true, cilindraje: true,
      provincia: true, ciudad: true, esElectrica: true,
      estado: true, createdAt: true
    }
  })
  console.log(JSON.stringify(last, null, 2))
}
main().finally(() => prisma.$disconnect())
