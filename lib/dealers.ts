import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { Dealer } from '@prisma/client'

const TRIAL_DAYS = 60
export const TRIAL_MAX_LISTINGS = 20

/**
 * Cuenta los listings activos y vigentes de un dealer.
 * Activo = estado='activo' y expiraEn > now.
 */
export async function countDealerActiveListings(dealerId: string): Promise<number> {
  return prisma.listing.count({
    where: {
      dealerId,
      estado: 'activo',
      expiraEn: { gt: new Date() },
    },
  })
}

/**
 * Estado del cupo de motos del dealer durante el programa de lanzamiento.
 * Mientras dura el trial: 20 motos activas como tope.
 */
export async function getDealerListingsState(dealerId: string): Promise<{
  activeCount: number
  limit: number
  canPublish: boolean
}> {
  const activeCount = await countDealerActiveListings(dealerId)
  return {
    activeCount,
    limit: TRIAL_MAX_LISTINGS,
    canPublish: activeCount < TRIAL_MAX_LISTINGS,
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function generateUniqueSlug(seed: string): Promise<string> {
  const base = slugify(seed) || 'dealer'
  let candidate = base
  let n = 2
  // Iterar hasta encontrar uno libre. En la practica casi siempre cae en la
  // primera iteracion porque el slug se valida live en el wizard.
  while (await prisma.dealer.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${n}`
    n++
    if (n > 1000) throw new Error('No se pudo generar slug unico')
  }
  return candidate
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const normalized = slugify(slug)
  if (!normalized || normalized !== slug) return false
  const existing = await prisma.dealer.findUnique({
    where: { slug: normalized },
    select: { id: true },
  })
  return !existing
}

export async function getDealerBySlug(slug: string) {
  return prisma.dealer.findUnique({
    where: { slug },
  })
}

export async function getDealerByUserId(userId: string) {
  return prisma.dealer.findUnique({
    where: { userId },
  })
}

export type CreateDealerInput = {
  userId: string
  // Paso 1
  nombreComercial: string
  slug: string
  descripcion?: string | null
  ciudad: string
  provincia: string
  direccion?: string | null
  googleMapsUrl?: string | null
  telefono?: string | null
  whatsapp?: string | null
  emailContacto?: string | null
  sitioWeb?: string | null
  redes?: Prisma.InputJsonValue | null
  // Paso 2
  ruc: string
  razonSocial: string
  logo: string
  bannerImage?: string | null
  documentoVerificacion: string
}

/**
 * Crea el Dealer y promueve el rol del User a "dealer". Todo en una transaccion.
 *
 * Side effects:
 *   - User.role: "user" -> "dealer"
 *   - Dealer creado con activo=true, verificado=false, subscriptionStatus="trial",
 *     trialEndsAt = NOW + 60 dias
 *   - DealerVerification creada con status="pending"
 *
 * Tras esta llamada, el caller debe forzar signOut + relogin para que el JWT
 * se renueve con role='dealer' y dealerId stamped.
 */
export async function createDealer(input: CreateDealerInput): Promise<Dealer> {
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { role: true, blocked: true },
    })
    if (!user) throw new Error('Usuario no encontrado')
    if (user.blocked) throw new Error('Usuario bloqueado')
    if (user.role !== 'user') throw new Error('Solo cuentas con rol "user" pueden registrarse como dealer')

    // Doble check de unicidad de slug y ruc dentro de la transaccion
    const slugTaken = await tx.dealer.findUnique({ where: { slug: input.slug }, select: { id: true } })
    if (slugTaken) throw new Error('SLUG_TAKEN')
    const rucTaken = await tx.dealer.findUnique({ where: { ruc: input.ruc }, select: { id: true } })
    if (rucTaken) throw new Error('RUC_TAKEN')

    const dealer = await tx.dealer.create({
      data: {
        userId: input.userId,
        slug: input.slug,
        nombreComercial: input.nombreComercial,
        descripcion: input.descripcion ?? null,
        ciudad: input.ciudad,
        provincia: input.provincia,
        direccion: input.direccion ?? null,
        googleMapsUrl: input.googleMapsUrl ?? null,
        telefono: input.telefono ?? null,
        whatsapp: input.whatsapp ?? null,
        emailContacto: input.emailContacto ?? null,
        sitioWeb: input.sitioWeb ?? null,
        redes: input.redes ?? Prisma.JsonNull,
        ruc: input.ruc,
        razonSocial: input.razonSocial,
        logo: input.logo,
        bannerImage: input.bannerImage ?? null,
        verificado: false,
        activo: true,
        subscriptionStatus: 'trial',
        trialEndsAt,
      },
    })

    await tx.dealerVerification.create({
      data: {
        dealerId: dealer.id,
        documentType: 'matricula_concesionario',
        documentUrl: input.documentoVerificacion,
        status: 'pending',
      },
    })

    await tx.user.update({
      where: { id: input.userId },
      data: { role: 'dealer' },
    })

    return dealer
  })
}

export type DealerListFilter = {
  ciudad?: string
  verificadosOnly?: boolean
}

export async function listDealersPublic(filter: DealerListFilter = {}) {
  // Solo dealers activos Y aprobados son visibles en el directorio publico.
  // Pendientes y rechazados quedan ocultos.
  const where: Prisma.DealerWhereInput = {
    activo: true,
    approvalStatus: 'approved',
  }
  if (filter.ciudad) where.ciudad = filter.ciudad
  if (filter.verificadosOnly) where.verificado = true

  return prisma.dealer.findMany({
    where,
    select: {
      id: true,
      slug: true,
      nombreComercial: true,
      logo: true,
      bannerImage: true,
      ciudad: true,
      provincia: true,
      verificado: true,
      createdAt: true,
    },
    orderBy: [
      { verificado: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

export function isDealerPublic(dealer: { activo: boolean; approvalStatus: string }): boolean {
  return dealer.activo && dealer.approvalStatus === 'approved'
}

export function trialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0
  const ms = trialEndsAt.getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// Validacion ligera de RUC ecuatoriano: 13 digitos, comportamiento estricto
// se delega al SRI. Este check evita typos obvios.
export function isValidRucFormat(ruc: string): boolean {
  return /^\d{13}$/.test(ruc.trim())
}

