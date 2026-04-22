const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const brandCount = await prisma.motoBrand.count()
  const modelCount = await prisma.motoModel.count()
  console.log('Marcas en DB:', brandCount)
  console.log('Modelos en DB:', modelCount)
  console.log('Tablas funcionan correctamente.')
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect())
