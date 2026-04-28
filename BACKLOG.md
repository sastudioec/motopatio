# Backlog técnico

Items conocidos pendientes que no están listos para implementar todavía. Cada uno
incluye contexto suficiente para que el siguiente que lo agarre entienda qué
falta y por qué.

_(Por ahora no hay items abiertos. Ver "Hecho" abajo.)_

## Hecho

### ~~Vista detalle de usuario en /admin~~ ✅ 2026-04-28

Implementada como server component en `app/admin/usuarios/[id]/page.tsx` con
header, perfil, acciones (bloquear/desbloquear/eliminar reusadas), card de
dealer si aplica, DealerApplication suelta si hay match por email, tablas de
listings (50), pagos (50), leads enviados (50) y audit (50). Botón "Ver
detalle" agregado en la tab usuarios del listado. Sin endpoint nuevo: el
server component consulta Prisma directo con `requireAdmin()`.
