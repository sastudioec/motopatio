import type { DealerPlan } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type DealerPlanId = 'dealer_starter' | 'dealer_pro' | 'dealer_premium'

let _cachedDealerPlans: DealerPlan[] | null = null

export async function getActiveDealerPlans(): Promise<DealerPlan[]> {
  if (_cachedDealerPlans) return _cachedDealerPlans
  _cachedDealerPlans = await prisma.dealerPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return _cachedDealerPlans
}

export async function getDealerPlanById(id: string): Promise<DealerPlan> {
  const plan = await prisma.dealerPlan.findUnique({ where: { id } })
  if (!plan) throw new Error(`DealerPlan no encontrado: ${id}`)
  if (!plan.isActive) throw new Error(`DealerPlan inactivo: ${id}`)
  return plan
}

export function invalidateDealerPlansCache() {
  _cachedDealerPlans = null
}

/**
 * Calcula la fecha de expiracion de una suscripcion a partir de la fecha
 * de inicio (o renovacion) y la duracion del plan en dias.
 *
 * PayPhone es one-shot: la "renovacion mensual" se simula con un nuevo cargo
 * manual disparado por email cuando la suscripcion esta por vencer (3 dias
 * antes). Este helper solo aritmetica de fechas.
 */
export function calcSubscriptionExpiresAt(from: Date, durationDays: number): Date {
  const expires = new Date(from)
  expires.setDate(expires.getDate() + durationDays)
  return expires
}
