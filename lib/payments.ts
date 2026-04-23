export type PaymentConcept = 'plan' | 'featured'

/**
 * Genera un clientTransactionId unico para PayPhone.
 * Formato: MP-{concept}-{ts36}-{rand6}
 *   - concept: 'plan' | 'featured'
 *   - ts36: timestamp en base 36, ordena lexicograficamente
 *   - rand6: 6 chars aleatorios
 * Ej: MP-plan-LKJ8FA-X3P9QZ
 *
 * Longitud maxima permitida por PayPhone: 50 chars. Este formato usa ~24.
 */
export function generateClientTxId(concept: PaymentConcept): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `MP-${concept}-${ts}-${rand}`
}
