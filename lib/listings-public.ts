import type { Prisma } from '@prisma/client'

/**
 * Filtro WHERE para queries de listings publicos. Excluye listings de
 * dealers no aprobados (pendientes o rechazados).
 *
 * Uso: combinar con AND en findMany / findUnique:
 *   prisma.listing.findMany({ where: { ...publicListingFilter(), estado: 'activo' } })
 *
 * NO aplicar en endpoints privados:
 *   - /api/mis-motos (dealer ve sus listings pendientes)
 *   - /api/admin/* (admin ve todo)
 *   - flujos de pago privados
 */
export function publicListingFilter(): Prisma.ListingWhereInput {
  return {
    OR: [
      { dealerId: null },
      { dealer: { is: { approvalStatus: 'approved', activo: true } } },
    ],
  }
}

/**
 * Include estandar para traer el dealer asociado y poder mostrar el badge
 * "Concesionario" en MotoCard cuando el listing pertenece a un dealer aprobado.
 */
export const publicListingDealerInclude = {
  dealer: {
    select: {
      id: true,
      slug: true,
      nombreComercial: true,
      verificado: true,
      approvalStatus: true,
    },
  },
} as const
