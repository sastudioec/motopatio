import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LENGTH = 5
const PREFIX = 'MP-'
const MAX_ATTEMPTS = 5

function randomCode(): string {
  let out = ''
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)]
  }
  return PREFIX + out
}

export async function generateListingPublicId(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomCode()
    const exists = await prisma.listing.findUnique({
      where: { publicId: candidate },
      select: { id: true },
    })
    if (!exists) return candidate
  }
  throw new Error('generateListingPublicId: no se pudo generar un código único tras ' + MAX_ATTEMPTS + ' intentos')
}
