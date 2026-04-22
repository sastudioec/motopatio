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
 * Valida si un usuario puede publicar con el plan gratuito ahora.
 * Retorna { allowed, nextAvailableAt, daysRemaining } donde:
 *   - allowed: si puede publicar
 *   - nextAvailableAt: cuando podra publicar gratis de nuevo (si no allowed)
 *   - daysRemaining: cuantos dias le faltan para desbloquearse
 */
export async function canPublishFreePlan(
  userId: string
): Promise<{ allowed: true } | {
  allowed: false
  nextAvailableAt: Date
  daysRemaining: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastFreePublicationAt: true },
  })

  if (!user) throw new Error('Usuario no encontrado')

  // Nunca publico gratis: permitido
  if (!user.lastFreePublicationAt) return { allowed: true }

  const cooldownDays = (await getPlanById('gratis')).cooldownDays
  const nextAvailableAt = new Date(user.lastFreePublicationAt)
  nextAvailableAt.setDate(nextAvailableAt.getDate() + cooldownDays)

  const now = new Date()
  if (now >= nextAvailableAt) return { allowed: true }

  const msRemaining = nextAvailableAt.getTime() - now.getTime()
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

  return { allowed: false, nextAvailableAt, daysRemaining }
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
