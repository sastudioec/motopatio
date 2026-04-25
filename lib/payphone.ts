/**
 * Cliente para la API de PayPhone Cajita de Pagos.
 * Docs: https://docs.payphone.app/cajita-de-pagos-payphone
 */

const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com/api'

export type PayPhoneConfirmResponse = {
  transactionId?: number
  clientTransactionId?: string
  transactionStatus?: 'Approved' | 'Canceled' | 'Pending' | 'NeedsVerification' | string
  amount?: number
  authorizationCode?: string
  message?: string
  cardBrand?: string
  lastDigits?: string
  email?: string
  phoneNumber?: string
  documentId?: string
  storeName?: string
  date?: string
  // Diagnostico de respuestas anomalas (HTML / no-JSON) del Confirm.
  // Permiten al caller decidir consultar el read-only Sale/client en lugar
  // de asumir cancelacion.
  httpStatus?: number
  rawHtmlBody?: string
  [key: string]: unknown
}

function getConfig() {
  const token = process.env.PAYPHONE_TOKEN
  const storeId = process.env.PAYPHONE_STORE_ID
  if (!token) throw new Error('PAYPHONE_TOKEN no esta configurado en .env')
  if (!storeId) throw new Error('PAYPHONE_STORE_ID no esta configurado en .env')
  return { token, storeId }
}

/**
 * Detecta si la respuesta es HTML (no JSON). PayPhone devuelve HTML al
 * /button/V2/Confirm en varios escenarios distintos (no solo cancelacion):
 * cuando la tx ya fue capturada y aprobada, cuando ya fue confirmada antes,
 * o errores transitorios. Por eso este predicado solo detecta HTML; la
 * decision de que hacer queda en el caller.
 */
function looksLikeHtml(text: string, contentType: string | null): boolean {
  if (contentType && contentType.toLowerCase().includes('text/html')) return true
  const head = text.trimStart().slice(0, 200).toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html') || head.includes('<html')
}

/**
 * Confirma una transaccion contra PayPhone usando los parametros
 * que PayPhone envia a la URL de respuesta tras el pago.
 */
export async function confirmTransaction(params: {
  id: number
  clientTxId: string
}): Promise<PayPhoneConfirmResponse> {
  const { token } = getConfig()

  const res = await fetch(PAYPHONE_API_BASE + '/button/V2/Confirm', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: params.id,
      clientTxId: params.clientTxId,
    }),
  })

  const text = await res.text()
  const contentType = res.headers.get('content-type')

  console.log(
    '[PayPhone Confirm] status=' + res.status,
    'content-type=' + (contentType || '-'),
    'clientTxId=' + params.clientTxId,
    'bodyLen=' + text.length
  )

  // PayPhone responde HTML al Confirm en varios escenarios (tx ya capturada,
  // tx ya confirmada, error transitorio, runtime error). NO asumimos
  // cancelacion: devolvemos NeedsVerification para que el caller consulte
  // el read-only /Sale/client/{clientTxId} y use ESA respuesta como fuente
  // de verdad.
  if (looksLikeHtml(text, contentType)) {
    console.log(
      '[PayPhone Confirm] HTML response. ClientTxId:', params.clientTxId,
      'body[0:500]=', text.slice(0, 500).replace(/\s+/g, ' ')
    )
    return {
      transactionId: params.id,
      clientTransactionId: params.clientTxId,
      transactionStatus: 'NeedsVerification',
      httpStatus: res.status,
      rawHtmlBody: text.slice(0, 2000),
      message: 'PayPhone respondio HTML; requiere verificacion read-only',
    } as PayPhoneConfirmResponse
  }

  let data: PayPhoneConfirmResponse = {}
  try {
    data = JSON.parse(text)
  } catch {
    console.log(
      '[PayPhone Confirm] Non-JSON non-HTML response. ClientTxId:', params.clientTxId,
      'body[0:500]=', text.slice(0, 500)
    )
    return {
      transactionId: params.id,
      clientTransactionId: params.clientTxId,
      transactionStatus: 'NeedsVerification',
      httpStatus: res.status,
      rawHtmlBody: text.slice(0, 2000),
      message: 'PayPhone respondio en formato no reconocido',
    } as PayPhoneConfirmResponse
  }

  data.httpStatus = res.status

  if (!res.ok) {
    throw new Error('PayPhone Confirm fallo ' + res.status + ': ' + (data.message || text.slice(0, 200)))
  }

  return data
}

/**
 * Consulta el estado de una transaccion usando el clientTransactionId que
 * nosotros generamos. Util para el reconciliador cuando no tenemos el
 * payphoneTransactionId (porque el usuario nunca volvio del redirect).
 *
 * GET /api/Sale/client/{clientTxId}
 * Limite documentado: 30 calls/min.
 */
export async function querySaleByClientTxId(
  clientTxId: string
): Promise<PayPhoneConfirmResponse | null> {
  const { token } = getConfig()

  const res = await fetch(PAYPHONE_API_BASE + '/Sale/client/' + encodeURIComponent(clientTxId), {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  })

  if (res.status === 404) return null

  const text = await res.text()
  const contentType = res.headers.get('content-type')
  if (looksLikeHtml(text, contentType)) {
    return {
      clientTransactionId: clientTxId,
      transactionStatus: 'Canceled',
      message: 'PayPhone devolvio HTML de error; tratado como Canceled',
    } as PayPhoneConfirmResponse
  }

  let data: PayPhoneConfirmResponse = {}
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('PayPhone Sale/client respondio no-JSON: ' + text.slice(0, 500))
  }
  if (!res.ok) {
    throw new Error(
      'PayPhone Sale/client fallo ' + res.status + ': ' + (data.message || text.slice(0, 200))
    )
  }
  return data
}

export type PaymentStatus = 'approved' | 'rejected' | 'cancelled' | 'pending' | 'error' | 'unknown'

/**
 * Traduce la respuesta de PayPhone al estado interno del Payment.
 *
 * Casos:
 *  - Approved -> 'approved'
 *  - Canceled CON authorizationCode -> 'cancelled' con reason 'post_auth_cancel_or_reverso'.
 *    El banco autorizo y la tx puede haber sido capturada y luego reversada.
 *    El caller debe alertar al admin para verificacion manual.
 *  - Canceled SIN authorizationCode -> 'cancelled' con reason 'user_rejected'.
 *    Cancelacion pre-autorizacion (usuario rechazo en la app, timeout, etc).
 *    NOTA: el authorizationCode no es senal perfecta de captura — tambien
 *    aparece en 3DS pre-captura. La diferenciacion sirve para priorizar
 *    revision manual, no para garantizar significado.
 *  - Pending -> 'pending'
 *  - NeedsVerification -> 'unknown'. El caller debe consultar Sale/client.
 *  - Otro -> 'rejected'
 */
export function mapPayphoneStatus(res: PayPhoneConfirmResponse): {
  paymentStatus: PaymentStatus
  reason?: string
} {
  const s = res.transactionStatus
  if (s === 'Approved') return { paymentStatus: 'approved' }
  if (s === 'Canceled') {
    if (res.authorizationCode) {
      return { paymentStatus: 'cancelled', reason: 'post_auth_cancel_or_reverso' }
    }
    return { paymentStatus: 'cancelled', reason: 'user_rejected' }
  }
  if (s === 'Pending') return { paymentStatus: 'pending', reason: 'PayPhone todavia no decide' }
  if (s === 'NeedsVerification') return { paymentStatus: 'unknown', reason: res.message }
  return {
    paymentStatus: 'rejected',
    reason: res.message || 'Estado no reconocido: ' + String(s),
  }
}

/**
 * Config publica para inicializar la Cajita en el frontend.
 * NO incluye el token (solo server-side). StoreId es publico.
 */
export function getPublicCajitaConfig() {
  const { storeId } = getConfig()
  return {
    storeId,
    cssUrl: 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css',
    jsUrl: 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js',
  }
}

