const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.payment.findUnique({
    where: { id: 'cmo9chjpu0001tp9bhiqkf6dw' },
    select: {
      id: true, status: true, userId: true,
      clientTransactionId: true, payphoneRawResponse: true,
      createdAt: true,
    }
  })
  if (!p) { console.log('NO EXISTE ese pago'); return }
  let draft = null
  try { draft = JSON.parse(p.payphoneRawResponse).listingDraft } catch {}
  console.log({
    id: p.id,
    status: p.status,
    userId: p.userId,
    createdAt: p.createdAt,
    hasDraft: !!draft,
    draftKeys: draft ? Object.keys(draft) : null,
    marca: draft?.marca,
    modelo: draft?.modelo,
    fotos: draft?.fotos?.length,
  })
}
main().finally(() => prisma.$disconnect())
