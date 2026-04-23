/**
 * Cliente para la API de PayPhone Cajita de Pagos.
 * Docs: https://docs.payphone.app/cajita-de-pagos-payphone
 */

const PAYPHONE_API_BASE = 'https://pay.payphonetodoesposible.com/api'

export type PayPhoneConfirmResponse = {
  transactionId?: number
  clientTransactionId?: string
  transactionStatus?: 'Approved' | 'Canceled' | 'Pending' | string
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
 * Detecta si una respuesta de PayPhone es en realidad una cancelacion
 * del usuario (PayPhone devuelve HTML de Runtime Error en ese caso).
 */
function isUserCancellationHtml(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('<!doctype html') ||
    lower.includes('<html') ||
    lower.includes('runtime error')
  )
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

  // Caso especial: PayPhone devuelve HTML de Runtime Error cuando
  // el usuario rechaza el pago desde la app. Lo tratamos como Canceled.
  if (isUserCancellationHtml(text)) {
    console.log('PayPhone: usuario rechazo el pago (HTML Runtime Error detectado). ClientTxId:', params.clientTxId)
    return {
      transactionId: params.id,
      clientTransactionId: params.clientTxId,
      transactionStatus: 'Canceled',
      statusCode: 2,
      message: 'El usuario rechazo el pago desde la app',
    } as PayPhoneConfirmResponse
  }

  let data: PayPhoneConfirmResponse = {}
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('PayPhone Confirm respondio no-JSON: ' + text.slice(0, 500))
  }

  if (!res.ok) {
    throw new Error('PayPhone Confirm fallo ' + res.status + ': ' + (data.message || text.slice(0, 200)))
  }

  return data
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

