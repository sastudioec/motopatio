# Backlog técnico

Items conocidos pendientes que no están listos para implementar todavía. Cada uno
incluye contexto suficiente para que el siguiente que lo agarre entienda qué
falta y por qué.

## Vista detalle de usuario en /admin

Hoy `/admin > usuarios` solo permite **Bloquear / Desbloquear / Eliminar**. La
API (`app/api/admin/usuarios/route.ts`) devuelve solo `user + _count.listings`.
No hay forma de ver desde admin:

- Perfil completo del usuario (nombre, teléfono, ciudad, fecha de creación,
  email verificado, último login).
- Listings publicados (activos, vendidos, suspendidos, expirados) con link al
  detalle.
- Historial de actividad: pagos, leads enviados, último login, acciones de
  admin sobre el usuario.
- Link directo al perfil público en frontend (cuando exista).

**Cuándo importa:** cada vez que un usuario se queja por email, hoy hay que
abrir Prisma Studio o consultar la DB a mano para responder. Una vista
detalle elimina ese paso.

**Trabajo pendiente:**

1. Endpoint `GET /api/admin/usuarios/[id]` que devuelva perfil + listings +
   payments + leads (con paginación si hace falta).
2. Página `app/admin/usuarios/[id]/page.tsx` o modal en la tab actual.
3. Wire-up del link desde la tabla actual (botón "Ver detalle" por fila).

**Por qué no está hecho ya:** prioridad menor que el feature de dealers y los
fixes del flow de pagos. Se levantó durante la sesión del 2026-04-28 al
revisar el caso del user `jpoloa@hotmail.com`.
