import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type ListingAuditAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'marked_sold'
  | 'deleted'

type RequestLike = {
  headers: { get(name: string): string | null }
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.NEXTAUTH_SECRET || 'mp-salt'
  return crypto.createHash('sha256').update(ip + ':' + salt).digest('hex').slice(0, 32)
}

function readReqContext(req?: RequestLike) {
  if (!req) return { userAgent: null as string | null, ipHash: null as string | null }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || null
  const userAgent = req.headers.get('user-agent') || null
  return { userAgent, ipHash: hashIp(ip) }
}

/**
 * Calcula el diff entre dos objetos sobre los campos indicados.
 * Devuelve { campo: { from, to } } solo para los que cambiaron.
 */
export function diffFields<T extends Record<string, any>>(
  before: T,
  after: Partial<T>,
  fields: ReadonlyArray<keyof T>,
): Record<string, { from: any; to: any }> {
  const out: Record<string, { from: any; to: any }> = {}
  for (const f of fields) {
    if (f in after) {
      const a = before[f]
      const b = after[f]
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        out[f as string] = { from: a, to: b }
      }
    }
  }
  return out
}

/**
 * Persiste una entrada de auditoria para un listing. No bloquea el flujo
 * principal: errores se loguean pero se devuelven silenciosamente.
 */
export async function logListingAction({
  listingId, userId, action, changes, req,
}: {
  listingId: string | null
  userId: string | null
  action: ListingAuditAction
  changes?: Record<string, any> | null
  req?: RequestLike
}): Promise<void> {
  try {
    const { userAgent, ipHash } = readReqContext(req)
    await prisma.listingAudit.create({
      data: {
        listingId,
        userId,
        action,
        changes: changes && Object.keys(changes).length > 0 ? changes : undefined,
        userAgent,
        ipHash,
      },
    })
  } catch (e) {
    console.error('[listingAudit] persist failed', { listingId, userId, action }, e)
  }
}
