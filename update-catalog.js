const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(s) {
  return s.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const UPDATES = [
  { brand: 'Factory', models: [
    'AK-47 250', 'AK47-X',
    'X2 250', 'X5 250', 'X6 250', 'X8 250',
    'M4 250', 'T4 250', 'TS 300',
    'Jason 250', 'Joker 250',
    'FX 110', 'FX 150', 'MX 55', 'Gass-Inn 50', 'Whatt-Inn',
    'Circuit-X 500', 'Dirt Shark F370', 'Drakon F300', 'FK370',
    'Redrock 500', 'Shift 500', 'Kenny 400', 'La Bestia',
    'ATV BigBear 200', 'ATV Chivo 50', 'ATV Kobra Kai 250',
    'ATV Manny 200', 'ATV Titan 300', 'Chivo E', 'Hummer 150',
    'Pepper 370',
  ]},
  { brand: 'Motor 1', models: [
    'Trail 200', 'Trail 250',
    'GNE 151 GS',
    'Fatty 150 LED',
    'Fortisima 150S',
    'Classic 250',
    'M1R 250',
    'Beast 250',
  ]},
  { brand: 'Bajaj', models: [
    'CT 100 ES', 'CT 125 PRO',
    'Pulsar LS 125',
    'Pulsar 180 FI',
    'Pulsar N250',
    'Pulsar NS 200 FI',
    'Pulsar NS400Z',
  ]},
  { brand: 'CF Moto', models: [
    '125 NK', '250 NK', '300 NK', '400 NK', '450 NK', '650 NK', '675 NK', '800 NK', '800 NK Sport',
    '250 SR', '300 SR', '450 SR', '450 SR-S', '675 SR-R',
    '300 SS',
    '300 CL-X', '450 CL-X', '650 CL-X', '700 CL-X', '700 CL-X Sport', '700 CL-X Heritage',
    '450 MT', '450 MT Adventure', '650 MT', '700 MT', '800 MT', '800 MT-X', '800 MT Explore', '1000 MT', '1000 MT-X',
    '650 GT',
    '650 Adventure', '650 TR-G',
    'Papio 125', 'Papio SS',
    'CForce 520', 'CForce 625', 'CForce 625 Overland', 'CForce 850 XC',
    'UForce 600', 'UForce 800', 'UForce 1000',
    'ZForce 550', 'ZForce 950', 'ZForce 1000 Sport',
  ]},
]

async function main() {
  console.log('Actualizando catalogo...')
  let totalCreated = 0
  let totalSkipped = 0

  for (const upd of UPDATES) {
    const brand = await prisma.motoBrand.findFirst({ where: { name: upd.brand } })
    if (!brand) {
      console.log('  [!] Marca "' + upd.brand + '" no existe en DB, omitiendo')
      continue
    }
    console.log('\n  Marca: ' + brand.name)
    for (const modelName of upd.models) {
      const exists = await prisma.motoModel.findFirst({
        where: { brandId: brand.id, name: modelName }
      })
      if (exists) { totalSkipped++; continue }
      await prisma.motoModel.create({
        data: { brandId: brand.id, name: modelName, slug: slugify(modelName) }
      })
      console.log('    + ' + modelName)
      totalCreated++
    }
  }

  console.log('\n=== Resumen ===')
  console.log('Modelos nuevos: ' + totalCreated)
  console.log('Modelos ya existentes (omitidos): ' + totalSkipped)
  const totalBrands = await prisma.motoBrand.count()
  const totalModels = await prisma.motoModel.count()
  console.log('Total en DB: ' + totalBrands + ' marcas, ' + totalModels + ' modelos')
}

main()
  .catch(e => { console.error('ERROR:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
