const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  // Intentar un query usando el campo nuevo
  const count = await prisma.listing.count()
  console.log('Total listings:', count)

  // Verificar que provincia existe como campo
  const one = await prisma.listing.findFirst({
    select: { id: true, ciudad: true, provincia: true }
  })
  console.log('Ejemplo de listing:', one || 'sin datos')
  console.log('Campo provincia accesible: OK')
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect())
