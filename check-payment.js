const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.payment.findUnique({
    where: { id: 'cmo9bks4f0019bla76x7vr18t' },
    select: {
      id: true, status: true, errorMessage: true,
      clientTransactionId: true, payphoneTransactionId: true,
      amountCents: true, currency: true, concept: true,
      createdAt: true, confirmedAt: true, updatedAt: true,
      payphoneRawResponse: true,
    }
  })
  console.log(JSON.stringify(p, null, 2))
}
main().finally(() => prisma.$disconnect())
