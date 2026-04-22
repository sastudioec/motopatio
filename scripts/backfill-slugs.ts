import { PrismaClient } from '@prisma/client'
import { buildListingSlug } from '../lib/slug'

const prisma = new PrismaClient()

async function main() {
  const listings = await prisma.listing.findMany({ where: { slug: null } })
  console.log(`${listings.length} listings sin slug`)
  for (const l of listings) {
    const slug = buildListingSlug(l)
    await prisma.listing.update({ where: { id: l.id }, data: { slug } })
    console.log(`  ${l.id}  →  ${slug}`)
  }
  const total = await prisma.listing.count({ where: { slug: { not: null } } })
  console.log(`Total con slug: ${total}`)
}

main().finally(() => prisma.$disconnect())
