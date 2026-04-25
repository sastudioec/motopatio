import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

const WHERE = {
  AND: [
    { publicId: { startsWith: 'TST-' } },
    { descripcion: { startsWith: '[TEST]' } },
  ],
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  const count = await prisma.listing.count({ where: WHERE })

  if (count === 0) {
    console.log('No hay motos de prueba para borrar.')
    return
  }

  const answer = await ask(`Se van a borrar ${count} motos de prueba. Escribí 'yes' para confirmar: `)
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelado. No se borró nada.')
    return
  }

  const deleted = await prisma.listing.deleteMany({ where: WHERE })
  console.log(`Borradas ${deleted.count} motos de prueba.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
