/**
 * Feature flags del modulo Dealers. Server-only (leen process.env directamente).
 * El Navbar y otras vistas client lo consumen via GET /api/dealers/config.
 */

export function dealersEnabled(): boolean {
  return process.env.DEALERS_ENABLED === 'true'
}

export function dealerPlansEnabled(): boolean {
  return process.env.DEALER_PLANS_ENABLED === 'true'
}
