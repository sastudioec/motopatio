import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Migra User.phone al formato E.164 (+593...) para registros que están en
// el formato ecuatoriano legacy "09XXXXXXXX". Cualquier otro formato no
// estándar se reporta y NO se toca — revisión manual.
//
// Uso:
//   npx tsx scripts/migrate-phones-to-e164.ts            # dry-run (default)
//   npx tsx scripts/migrate-phones-to-e164.ts --apply    # escribe cambios

const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

const EC_LEGACY = /^09\d{8}$/
const EC_E164 = /^\+5939\d{8}$/

type Plan = { userId: string; oldPhone: string; newPhone: string }
type Skip = { userId: string; phone: string; reason: string }

async function main() {
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, phone: true },
  })

  const plan: Plan[] = []
  const alreadyOk: { userId: string; phone: string }[] = []
  const skipped: Skip[] = []

  for (const u of users) {
    const raw = (u.phone || '').trim()
    if (!raw) continue

    if (raw.startsWith('+')) {
      if (EC_E164.test(raw) || /^\+\d{8,15}$/.test(raw)) alreadyOk.push({ userId: u.id, phone: raw })
      else skipped.push({ userId: u.id, phone: raw, reason: 'starts_with_plus_but_invalid' })
      continue
    }

    if (EC_LEGACY.test(raw)) {
      // 09XXXXXXXX → +5939XXXXXXXX (drop the leading 0)
      const newPhone = '+593' + raw.slice(1)
      plan.push({ userId: u.id, oldPhone: raw, newPhone })
      continue
    }

    skipped.push({ userId: u.id, phone: raw, reason: 'unknown_format' })
  }

  console.log(`Total usuarios con phone no nulo: ${users.length}`)
  console.log(`  Ya en E.164 válido:           ${alreadyOk.length}`)
  console.log(`  A migrar (09XXXXXXXX → +593): ${plan.length}`)
  console.log(`  Saltados (formato raro):      ${skipped.length}`)
  console.log('')

  if (plan.length > 0) {
    console.log('Plan de migración:')
    for (const p of plan) console.log(`  ${p.userId}  ${p.oldPhone}  →  ${p.newPhone}`)
    console.log('')
  }

  if (skipped.length > 0) {
    console.log('Saltados (revisión manual):')
    for (const s of skipped) console.log(`  ${s.userId}  ${s.phone}  [${s.reason}]`)
    console.log('')
  }

  if (!APPLY) {
    console.log('— DRY-RUN — no se escribió nada. Re-ejecuta con --apply para aplicar.')
    return
  }

  if (plan.length === 0) {
    console.log('Nada que aplicar.')
    return
  }

  const logsDir = path.join(__dirname, 'logs')
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(logsDir, `phones-e164-backup-${stamp}.json`)
  const backup = plan.map(p => ({ ...p, timestamp: new Date().toISOString() }))
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
  console.log(`Backup escrito en: ${backupPath}`)

  for (const p of plan) {
    await prisma.user.update({ where: { id: p.userId }, data: { phone: p.newPhone } })
    console.log(`  ✓ ${p.userId}  ${p.oldPhone}  →  ${p.newPhone}`)
  }

  console.log('')
  console.log(`Listo. ${plan.length} registros actualizados.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
