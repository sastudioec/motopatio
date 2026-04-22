import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { plan: true, user: { select: { email: true } } },
  })
  if (!p) { console.log('Sin payments'); return }
  console.log('Payment:', {
    id: p.id,
    concept: p.concept,
    amount: '$' + (p.amountCents / 100),
    status: p.status,
    clientTransactionId: p.clientTransactionId,
    payphoneTransactionId: p.payphoneTransactionId,
    createdAt: p.createdAt,
    confirmedAt: p.confirmedAt,
    errorMessage: p.errorMessage,
    user: p.user.email,
    plan: p.plan?.name,
  })
  if (p.payphoneRawResponse) {
    try {
      const parsed = JSON.parse(p.payphoneRawResponse)
      if (parsed.payphone) {
        console.log('PayPhone response:', JSON.stringify(parsed.payphone, null, 2))
      }
    } catch {}
  }
}
main().finally(() => prisma.$disconnect())
