import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  const data = {
    users: await prisma.user.findMany(),
    listings: await prisma.listing.findMany(),
    plans: await prisma.plan.findMany(),
    accounts: await prisma.account.findMany(),
    sessions: await prisma.session.findMany(),
    banners: await prisma.banner.findMany(),
    bannerImpressions: await prisma.bannerImpression.findMany(),
    bannerClicks: await prisma.bannerClick.findMany(),
  }

  console.log('Registros por tabla:')
  for (const [k, v] of Object.entries(data)) {
    console.log('  ' + k + ': ' + v.length)
  }

  const dir = join(homedir(), 'motopatio-backups')
  mkdirSync(dir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const file = join(dir, 'motopatio-' + ts + '.json')
  writeFileSync(file, JSON.stringify(data, null, 2))
  console.log('Backup guardado en:', file)
}

main().finally(() => prisma.$disconnect())

