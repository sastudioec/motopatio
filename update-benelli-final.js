const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(s) {
  return s.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Catalogo Benelli Ecuador oficial (benelli.com/ec-es) + comunes en el mercado
const BENELLI = [
  '180S',
  'TNT15',
  'TNT 150',
  'TNT 135',
  'TNT 25',
  'TNT 600',
  '302S',
  '502C',
  '752S',
  'TRK 251',
  'TRK 502',
  'TRK 502 X',
  'TRK 702',
  'TRK 702 X',
  'Leoncino 250',
  'Leoncino 500',
  'Leoncino 500 Trail',
  'Leoncino 800',
  'Leoncino 800 Trail',
  'Imperiale 400',
  'Otro',
]

async function main() {
  const brand = await prisma.motoBrand.findFirst({ where: { name: 'Benelli' } })
  if (!brand) { console.log('ERROR: Benelli no existe'); return }

  console.log('Limpiando modelos viejos de Benelli...')
  const deleted = await prisma.motoModel.deleteMany({ where: { brandId: brand.id } })
  console.log('Eliminados: ' + deleted.count)

  console.log('\nInsertando catalogo Benelli Ecuador:')
  for (const name of BENELLI) {
    await prisma.motoModel.create({
      data: { brandId: brand.id, name, slug: slugify(name) }
    })
    console.log('  + ' + name)
  }

  const total = await prisma.motoModel.count({ where: { brandId: brand.id } })
  console.log('\nTotal Benelli: ' + total + ' modelos')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
