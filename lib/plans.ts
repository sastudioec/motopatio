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
 * Cupo de por vida del plan Gratis: 3 publicaciones totales por usuario,
 * sumando vendidas, eliminadas, expiradas y activas. Cuando se alcanza,
 * el usuario ya no puede publicar gratis (debe elegir Basico/Full).
 *
 * Es una constante de codigo (no de BD) porque es promocional y reversible
 * cambiando este numero. La duracion individual de cada publicacion sigue
 * tomandose de Plan.durationDays.
 */
export const FREE_PLAN_LIFETIME_LIMIT = 3

/**
 * Retorna el uso del plan Gratis para un usuario:
 *   - usedCount: cuantas publicaciones gratis ha creado HISTORICAMENTE
 *     (incluye activas, suspendidas, vendidas, eliminadas y expiradas)
 *   - limit: cupo de por vida (FREE_PLAN_LIFETIME_LIMIT)
 *   - canPublish: si todavia tiene cupo (usedCount < limit)
 */
export async function getFreePlanState(
  userId: string
): Promise<{
  usedCount: number
  limit: number
  canPublish: boolean
}> {
  const usedCount = await prisma.listing.count({
    where: { userId, planTipo: 'gratis' },
  })
  return {
    usedCount,
    limit: FREE_PLAN_LIFETIME_LIMIT,
    canPublish: usedCount < FREE_PLAN_LIFETIME_LIMIT,
  }
}

/**
 * Valida si un usuario puede publicar con el plan gratuito.
 * Bloquea cuando ya uso sus 3 publicaciones de por vida.
 */
export async function canPublishFreePlan(
  userId: string
): Promise<{ allowed: true } | {
  allowed: false
  reason: 'limit_reached'
  usedCount: number
  limit: number
}> {
  const state = await getFreePlanState(userId)
  if (!state.canPublish) {
    return {
      allowed: false,
      reason: 'limit_reached',
      usedCount: state.usedCount,
      limit: state.limit,
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
