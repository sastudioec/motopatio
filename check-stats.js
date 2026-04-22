const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const stats = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
  })
  console.log('Pagos por status:')
  console.log(JSON.stringify(stats, null, 2))

  const errors = await prisma.payment.findMany({
    where: { status: 'error' },
    select: { id: true, errorMessage: true, createdAt: true, amountCents: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  console.log('\nÚltimos 10 pagos con error:')
  console.log(JSON.stringify(errors, null, 2))
}
main().finally(() => prisma.$disconnect())
