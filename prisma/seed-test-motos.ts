import { PrismaClient } from '@prisma/client'
import { buildListingSlug } from '../lib/slug'

const prisma = new PrismaClient()

const TEST_PHOTOS = [
  'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/cld-sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg',
  'https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg',
  'https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg',
]

const PROV_LETRA: Record<string, string> = {
  'Pichincha': 'P', 'Guayas': 'G', 'Azuay': 'A', 'Tungurahua': 'T',
}
const ALPHA = 'BCDEFHJKLMNPQRSTUVWXYZ'

function placaDeIndice(i: number, provincia: string): string {
  const p = PROV_LETRA[provincia] ?? 'X'
  const l1 = ALPHA[i % ALPHA.length]
  const l2 = ALPHA[(i * 7 + 3) % ALPHA.length]
  const ultimo = i % 10
  const base = String(100 + i).padStart(3, '0')
  return `${p}${l1}${l2}-${base}${ultimo}`
}

type TestMoto = {
  publicId: string
  marca: string
  modelo: string
  anio: number
  cilindraje: string
  tipo: string
  km: number
  precio: number
  ciudad: string
  provincia: string
  color: string
  destacadoHastaDias: number | null
  esElectrica?: boolean
}

const MOTOS: TestMoto[] = [
  // Destacadas (10) — destacadoHasta = now + N días
  { publicId: 'TST-A001', marca: 'Honda',    modelo: 'CBR 250R',       anio: 2023, cilindraje: '250', tipo: 'Deportiva',       km: 8000,  precio: 5500, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Rojo',   destacadoHastaDias: 5  },
  { publicId: 'TST-A002', marca: 'Yamaha',   modelo: 'FZ 250',         anio: 2022, cilindraje: '250', tipo: 'Naked',           km: 12000, precio: 4800, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Azul',   destacadoHastaDias: 10 },
  { publicId: 'TST-A003', marca: 'Kawasaki', modelo: 'Ninja 250',      anio: 2024, cilindraje: '250', tipo: 'Deportiva',       km: 3500,  precio: 6200, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Verde',  destacadoHastaDias: 15 },
  { publicId: 'TST-A004', marca: 'Suzuki',   modelo: 'V-Strom 250',    anio: 2023, cilindraje: '250', tipo: 'Trail/Enduro',    km: 9500,  precio: 5800, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Amarillo', destacadoHastaDias: 20 },
  { publicId: 'TST-A005', marca: 'Super Soco', modelo: 'TC Max',       anio: 2024, cilindraje: '0',   tipo: 'Naked',           km: 4000,  precio: 3200, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Negro',  destacadoHastaDias: 25, esElectrica: true },
  { publicId: 'TST-A006', marca: 'Honda',    modelo: 'XR 150L',        anio: 2023, cilindraje: '150', tipo: 'Trail/Enduro',    km: 11000, precio: 2800, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Blanco', destacadoHastaDias: 30 },
  { publicId: 'TST-A007', marca: 'Yamaha',   modelo: 'XTZ 150',        anio: 2022, cilindraje: '150', tipo: 'Doble propósito', km: 18000, precio: 2400, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Azul',   destacadoHastaDias: 35 },
  { publicId: 'TST-A008', marca: 'Suzuki',   modelo: 'Gixxer',         anio: 2024, cilindraje: '150', tipo: 'Naked',           km: 5000,  precio: 2900, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Rojo',   destacadoHastaDias: 40 },
  { publicId: 'TST-A009', marca: 'Kawasaki', modelo: 'KLX 150',        anio: 2025, cilindraje: '150', tipo: 'Trail/Enduro',    km: 1500,  precio: 4500, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Verde',  destacadoHastaDias: 45 },
  { publicId: 'TST-A010', marca: 'Honda',    modelo: 'CB 190R',        anio: 2023, cilindraje: '200', tipo: 'Naked',           km: 7500,  precio: 3400, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Negro',  destacadoHastaDias: 50 },

  // Normales (30) — destacadoHasta = null
  { publicId: 'TST-A011', marca: 'Honda',    modelo: 'CB 125F',        anio: 2020, cilindraje: '125', tipo: 'Urbana',          km: 25000, precio: 1400, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A012', marca: 'Yamaha',   modelo: 'YBR 125',        anio: 2019, cilindraje: '125', tipo: 'Urbana',          km: 32000, precio: 1200, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A013', marca: 'Suzuki',   modelo: 'GN 125',         anio: 2018, cilindraje: '125', tipo: 'Naked',           km: 45000, precio: 1000, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A014', marca: 'Bajaj',    modelo: 'Pulsar 125',     anio: 2021, cilindraje: '125', tipo: 'Naked',           km: 19000, precio: 1600, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A015', marca: 'NIU',      modelo: 'NQi GTS',        anio: 2022, cilindraje: '0',   tipo: 'Scooter',         km: 14000, precio: 1800, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Blanco',   destacadoHastaDias: null, esElectrica: true },
  { publicId: 'TST-A016', marca: 'Yamaha',   modelo: 'FZ 150',         anio: 2021, cilindraje: '150', tipo: 'Naked',           km: 22000, precio: 2200, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A017', marca: 'Bajaj',    modelo: 'Discover 150',   anio: 2020, cilindraje: '150', tipo: 'Urbana',          km: 28000, precio: 1700, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A018', marca: 'Suzuki',   modelo: 'DR 200',         anio: 2019, cilindraje: '200', tipo: 'Trail/Enduro',    km: 35000, precio: 2100, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Amarillo', destacadoHastaDias: null },
  { publicId: 'TST-A019', marca: 'Yamaha',   modelo: 'XTZ 250',        anio: 2018, cilindraje: '250', tipo: 'Doble propósito', km: 42000, precio: 2700, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A020', marca: 'Honda',    modelo: 'CB 250 Twister', anio: 2022, cilindraje: '250', tipo: 'Naked',           km: 16000, precio: 2800, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A021', marca: 'Bajaj',    modelo: 'Boxer CT 100',   anio: 2018, cilindraje: '125', tipo: 'Urbana',          km: 52000, precio:  900, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A022', marca: 'Honda',    modelo: 'CG 125',         anio: 2019, cilindraje: '125', tipo: 'Urbana',          km: 38000, precio: 1100, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A023', marca: 'Yamaha',   modelo: 'Crypton',        anio: 2020, cilindraje: '125', tipo: 'Urbana',          km: 21000, precio: 1300, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A024', marca: 'Suzuki',   modelo: 'AX 4',           anio: 2021, cilindraje: '125', tipo: 'Urbana',          km: 17000, precio: 1500, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Blanco',   destacadoHastaDias: null },
  { publicId: 'TST-A025', marca: 'Honda',    modelo: 'CBF 150',        anio: 2020, cilindraje: '150', tipo: 'Naked',           km: 26000, precio: 1900, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Verde',    destacadoHastaDias: null },
  { publicId: 'TST-A026', marca: 'Yamaha',   modelo: 'YBR 150',        anio: 2019, cilindraje: '150', tipo: 'Naked',           km: 31000, precio: 1750, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A027', marca: 'Kawasaki', modelo: 'KLX 150',        anio: 2021, cilindraje: '150', tipo: 'Trail/Enduro',    km: 12000, precio: 2400, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Verde',    destacadoHastaDias: null },
  { publicId: 'TST-A028', marca: 'Bajaj',    modelo: 'Pulsar 150',     anio: 2022, cilindraje: '150', tipo: 'Naked',           km: 13000, precio: 2050, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A029', marca: 'Suzuki',   modelo: 'Gixxer',         anio: 2020, cilindraje: '150', tipo: 'Naked',           km: 24000, precio: 2150, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A030', marca: 'Honda',    modelo: 'XR 150L',        anio: 2018, cilindraje: '150', tipo: 'Trail/Enduro',    km: 41000, precio: 1850, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A031', marca: 'Yamaha',   modelo: 'XTZ 150',        anio: 2023, cilindraje: '150', tipo: 'Doble propósito', km:  9000, precio: 2600, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A032', marca: 'Bajaj',    modelo: 'Pulsar NS 200',  anio: 2019, cilindraje: '200', tipo: 'Naked',           km: 30000, precio: 2300, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Amarillo', destacadoHastaDias: null },
  { publicId: 'TST-A033', marca: 'Honda',    modelo: 'CB 190R',        anio: 2020, cilindraje: '200', tipo: 'Naked',           km: 23000, precio: 2500, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A034', marca: 'Suzuki',   modelo: 'DR 200',         anio: 2021, cilindraje: '200', tipo: 'Trail/Enduro',    km: 18000, precio: 2700, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Blanco',   destacadoHastaDias: null },
  { publicId: 'TST-A035', marca: 'Bajaj',    modelo: 'Pulsar 200',     anio: 2022, cilindraje: '200', tipo: 'Naked',           km: 11000, precio: 2650, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A036', marca: 'Kawasaki', modelo: 'Ninja 250',      anio: 2018, cilindraje: '250', tipo: 'Deportiva',       km: 39000, precio: 2950, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Verde',    destacadoHastaDias: null },
  { publicId: 'TST-A037', marca: 'Yamaha',   modelo: 'FZ 250',         anio: 2020, cilindraje: '250', tipo: 'Naked',           km: 27000, precio: 2850, ciudad: 'Ambato',    provincia: 'Tungurahua',  color: 'Azul',     destacadoHastaDias: null },
  { publicId: 'TST-A038', marca: 'Suzuki',   modelo: 'GSX 250R',       anio: 2019, cilindraje: '250', tipo: 'Deportiva',       km: 33000, precio: 3000, ciudad: 'Cuenca',    provincia: 'Azuay',       color: 'Negro',    destacadoHastaDias: null },
  { publicId: 'TST-A039', marca: 'Honda',    modelo: 'CBR 250R',       anio: 2018, cilindraje: '250', tipo: 'Deportiva',       km: 44000, precio: 2750, ciudad: 'Quito',     provincia: 'Pichincha',   color: 'Rojo',     destacadoHastaDias: null },
  { publicId: 'TST-A040', marca: 'Bajaj',    modelo: 'Dominar 250',    anio: 2024, cilindraje: '250', tipo: 'Naked',           km:  6000, precio: 2950, ciudad: 'Guayaquil', provincia: 'Guayas',      color: 'Negro',    destacadoHastaDias: null },
]

async function pickUserId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })
  if (admin) {
    console.log(`Usuario destino (admin): ${admin.email} [${admin.id}]`)
    return admin.id
  }
  const first = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })
  if (first) {
    console.log(`Usuario destino (primer User): ${first.email} [${first.id}]`)
    return first.id
  }
  throw new Error('No hay usuarios en la tabla User. Creá al menos uno antes de seedear motos de prueba.')
}

async function main() {
  const userId = await pickUserId()

  const deleted = await prisma.listing.deleteMany({
    where: {
      AND: [
        { publicId: { startsWith: 'TST-' } },
        { descripcion: { startsWith: '[TEST]' } },
      ],
    },
  })
  if (deleted.count > 0) {
    console.log(`Borradas ${deleted.count} motos de prueba previas (publicId TST-* + descripcion [TEST]).`)
  }

  const now = new Date()
  const expiraEn = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  let destacadasCount = 0
  let normalesCount = 0

  for (let i = 0; i < MOTOS.length; i++) {
    const m = MOTOS[i]
    const fotoUrl = TEST_PHOTOS[i % TEST_PHOTOS.length]
    const destacadoHasta = m.destacadoHastaDias !== null
      ? new Date(now.getTime() + m.destacadoHastaDias * 24 * 60 * 60 * 1000)
      : null

    const created = await prisma.listing.create({
      data: {
        publicId: m.publicId,
        user: { connect: { id: userId } },
        marca: m.marca,
        modelo: m.modelo,
        anio: m.anio,
        cilindraje: m.cilindraje,
        tipo: m.tipo,
        km: m.km,
        precio: m.precio,
        ciudad: m.ciudad,
        provincia: m.provincia,
        color: m.color,
        descripcion: `[TEST] ${m.marca} ${m.modelo} ${m.anio} — moto de prueba para validar /motos (destacadas, paginado, filtros).`,
        fotos: JSON.stringify([fotoUrl]),
        placa: placaDeIndice(i, m.provincia),
        estado: 'activo',
        planTipo: 'gratis',
        publishedAt: now,
        expiraEn,
        destacado: destacadoHasta !== null,
        destacadoHasta,
        esElectrica: m.esElectrica ?? false,
      },
    })

    const slug = buildListingSlug(created)
    await prisma.listing.update({ where: { id: created.id }, data: { slug } })

    if (destacadoHasta !== null) destacadasCount++
    else normalesCount++
  }

  const total = await prisma.listing.count({
    where: {
      AND: [
        { publicId: { startsWith: 'TST-' } },
        { descripcion: { startsWith: '[TEST]' } },
      ],
    },
  })

  console.log(`Creadas ${destacadasCount} destacadas y ${normalesCount} normales. Total motos de test: ${total}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
