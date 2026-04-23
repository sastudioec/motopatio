import { PrismaClient, Plan } from '@prisma/client'

const prisma = new PrismaClient()

export type PlanId = 'gratis' | 'basico' | 'full'

/**
 * Obtiene todos los planes activos del catalogo, ordenados por sortOrder.
 * Cachea en memoria por la duracion del proceso (planes cambian raro).
 */
let _cachedPlans: Plan[] | null = null
export async function getActivePlans(): Promise<Plan[]> {
  if (_cachedPlans) return _cachedPlans
  _cachedPlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return _cachedPlans
}

/**
 * Obtiene un plan por su id. Lanza error si no existe o esta inactivo.
 */
export async function getPlanById(id: string): Promise<Plan> {
  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) throw new Error(`Plan no encontrado: ${id}`)
  if (!plan.isActive) throw new Error(`Plan inactivo: ${id}`)
  return plan
}

/**
 * Invalida el cache de planes en memoria. Llamar despues de actualizar precios
 * o features desde el admin panel.
 */
export function invalidatePlansCache() {
  _cachedPlans = null
}

/**
 * Calcula la fecha de expiracion de una publicacion a partir de la fecha
 * de publicacion y la duracion del plan en dias.
 */
export function calcExpiresAt(publishedAt: Date, durationDays: number): Date {
  const expires = new Date(publishedAt)
  expires.setDate(expires.getDate() + durationDays)
  return expires
}

/**
 * Calcula la fecha hasta la cual un destacado es valido.
 * Si featuredDays es 0, retorna null (plan sin destacado).
 */
export function calcFeaturedUntil(
  from: Date,
  featuredDays: number
): Date | null {
  if (featuredDays <= 0) return null
  const until = new Date(from)
  until.setDate(until.getDate() + featuredDays)
  return until
}

/**
 * Retorna el estado del plan Gratis para un usuario:
 *   - hasFreeActive: si tiene un listing Gratis activo y vigente (expiraEn futuro)
 *   - cooldownUntil: fecha hasta la cual no puede publicar gratis (null si puede)
 *   - daysRemaining: dias que faltan para desbloquearse (0 si puede ya)
 *
 * Regla: 1 anuncio cada 30 dias, contado desde createdAt del ULTIMO Gratis
 * del usuario sin importar estado. Si suspende antes, NO se recupera el cupo.
 */
export async function getFreePlanState(
  userId: string
): Promise<{
  hasFreeActive: boolean
  cooldownUntil: Date | null
  daysRemaining: number
}> {
  const plan = await getPlanById('gratis')
  const cooldownDays = plan.cooldownDays
  const now = new Date()

  // Activo: listing Gratis con estado=activo y expiraEn futuro
  const activo = await prisma.listing.findFirst({
    where: {
      userId,
      planTipo: 'gratis',
      estado: 'activo',
      expiraEn: { gt: now },
    },
    select: { id: true },
  })

  // Ultimo Gratis (sin importar estado) para cooldown
  const ultimoGratis = await prisma.listing.findFirst({
    where: { userId, planTipo: 'gratis' },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  let cooldownUntil: Date | null = null
  let daysRemaining = 0
  if (ultimoGratis) {
    const fin = new Date(ultimoGratis.createdAt)
    fin.setDate(fin.getDate() + cooldownDays)
    if (fin > now) {
      cooldownUntil = fin
      daysRemaining = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  return { hasFreeActive: !!activo, cooldownUntil, daysRemaining }
}

/**
 * Valida si un usuario puede publicar con el plan gratuito ahora.
 * Bloquea si ya tiene un Gratis activo O si esta en cooldown de 30 dias.
 */
export async function canPublishFreePlan(
  userId: string
): Promise<{ allowed: true } | {
  allowed: false
  reason: 'active' | 'cooldown'
  nextAvailableAt: Date | null
  daysRemaining: number
}> {
  const state = await getFreePlanState(userId)
  if (state.hasFreeActive) {
    return {
      allowed: false,
      reason: 'active',
      nextAvailableAt: state.cooldownUntil,
      daysRemaining: state.daysRemaining,
    }
  }
  if (state.cooldownUntil) {
    return {
      allowed: false,
      reason: 'cooldown',
      nextAvailableAt: state.cooldownUntil,
      daysRemaining: state.daysRemaining,
    }
  }
  return { allowed: true }
}

/**
 * Formatea un precio en centavos a string con dos decimales.
 * Ej: 500 -> "5.00", 1000 -> "10.00", 0 -> "0.00"
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Convierte dolares a centavos (util para validar montos recibidos del frontend).
 * Ej: 5 -> 500, 10.5 -> 1050
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}
