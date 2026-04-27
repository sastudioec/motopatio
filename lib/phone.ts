/**
 * Normaliza un numero de Ecuador para uso en wa.me (WhatsApp).
 * wa.me NO acepta el "+" — espera solo digitos con el codigo de pais.
 *
 * Reglas:
 *   - Strip de cualquier caracter no numerico
 *   - Si empieza con "0" (formato local Ecuador), reemplazar el 0 por 593
 *   - Si tiene 9 digitos y empieza con 9 (sin 0 ni codigo), prepender 593
 *   - Si ya empieza con 593, dejar como esta
 *
 * Ejemplos:
 *   normalizeEcuadorPhone('0998562501')      -> '593998562501'
 *   normalizeEcuadorPhone('+593998562501')   -> '593998562501'
 *   normalizeEcuadorPhone('593998562501')    -> '593998562501'
 *   normalizeEcuadorPhone('998562501')       -> '593998562501'
 *   normalizeEcuadorPhone('022345678')       -> '59322345678' (fijo Quito)
 */
export function normalizeEcuadorPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('593')) return digits
  if (digits.startsWith('0')) return '593' + digits.slice(1)
  // Sin 0 ni codigo de pais: prefijar 593 (movil 9 digitos o fijo 8 digitos)
  return '593' + digits
}

/**
 * Construye una URL wa.me valida con el numero normalizado y mensaje opcional.
 */
export function buildWaMeUrl(phone: string, message?: string): string {
  const num = normalizeEcuadorPhone(phone)
  const base = 'https://wa.me/' + num
  return message ? base + '?text=' + encodeURIComponent(message) : base
}
