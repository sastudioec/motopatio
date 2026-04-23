import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  confirmTransaction,
  querySaleByClientTxId,
  mapPayphoneStatus,
  type PayPhoneConfirmResponse,
} from '@/lib/payphone'
import { activatePayment } from '@/lib/payments/activate'
import { handleRejectedPayment } from '@/lib/payments/reject'

/**
 * GET /api/pagos/reconciliar
 *
 * Cron cada 5 min. Procesa Payments stale (pending/error) consultando a
 * PayPhone por su estado real y sincronizando:
 *   - approved  → activatePayment (crea Listing o extiende destacado)
 *   - rejected/cancelled → handleRejectedPayment con email (el usuario
 *     no esta presente)
 *   - pending   → skip, proxima corrida
 *
 * Estrategia de consulta:
 *   - Si Payment tiene payphoneTransactionId (rama error del confirmar):
 *     usa POST /button/V2/Confirm (id + clientTxId).
 *   - Si no (usuario nunca volvio del redirect): usa
 *     GET /api/Sale/client/{clientTxId} que solo necesita el clientTxId.
 *
 * Ventana de trabajo: createdAt entre hace 24h y hace 2 min (el lower bound
 * evita pegarle a pagos recien iniciados todavia abiertos en la Cajita).
 *
 * Auth: Bearer RECONCILIATOR_SECRET. No exponer publicamente.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.RECONCILIATOR_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'RECONCILIATOR_SECRET no configurado' },
      { status: 503 }
    )
  }

  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = Date.now()
  const maxAgeMs = 24 * 60 * 60 * 1000
  const minAgeMs = 2 * 60 * 1000

  const stale = await prisma.payment.findMany({
    where: {
      status: { in: ['pending', 'error'] },
      createdAt: {
        gte: new Date(now - maxAgeMs),
        lte: new Date(now - minAgeMs),
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  const stats = {
    scanned: stale.length,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    stillPending: 0,
    queryErrors: 0,
    activationErrors: 0,
  }

  for (const p of stale) {
    let ppResponse: PayPhoneConfirmResponse | null = null
    try {
      if (p.payphoneTransactionId) {
        const txId = parseInt(p.payphoneTransactionId)
        if (!Number.isFinite(txId)) {
          ppResponse = await querySaleByClientTxId(p.clientTransactionId)
        } else {
          ppResponse = await confirmTransaction({
            id: txId,
            clientTxId: p.clientTransactionId,
          })
        }
      } else {
        ppResponse = await querySaleByClientTxId(p.clientTransactionId)
      }
    } catch (e) {
      stats.queryErrors++
      console.error(
        '[reconciliar] query error',
        p.id,
        p.clientTransactionId,
        e instanceof Error ? e.message : String(e)
      )
      continue
    }

    if (!ppResponse) {
      stats.queryErrors++
      console.log('[reconciliar] not found in PayPhone', p.id, p.clientTransactionId)
      continue
    }

    const { paymentStatus, reason } = mapPayphoneStatus(ppResponse)
    console.log(
      '[reconciliar]',
      p.id,
      p.clientTransactionId,
      'pp=' + ppResponse.transactionStatus,
      '→',
      paymentStatus
    )

    if (paymentStatus === 'pending') {
      stats.stillPending++
      continue
    }

    if (paymentStatus === 'approved') {
      await prisma.payment.update({
        where: { id: p.id },
        data: {
          status: 'approved',
          payphoneTransactionId: String(ppResponse.transactionId || p.payphoneTransactionId || ''),
          payphoneRawResponse: JSON.stringify(ppResponse),
          confirmedAt: new Date(),
        },
      })
      const result = await activatePayment(p.id)
      if (result.status === 'missing_data') {
        stats.activationErrors++
        console.error('[reconciliar] activation missing_data', p.id, result.reason)
      } else {
        stats.approved++
      }
      continue
    }

    if (paymentStatus !== 'cancelled' && paymentStatus !== 'rejected') {
      // 'error' no deberia llegar aca (mapPayphoneStatus solo devuelve error
      // si lanza confirmTransaction, que habriamos catcheado arriba).
      stats.queryErrors++
      console.error('[reconciliar] unexpected status', p.id, paymentStatus)
      continue
    }

    const res = await handleRejectedPayment(p.id, {
      newStatus: paymentStatus,
      payphoneTransactionId: String(ppResponse.transactionId || p.payphoneTransactionId || ''),
      rawResponse: ppResponse,
      errorMessage: reason,
      sendEmail: true, // usuario no esta presente; la UI no cubre
    })
    if (res.changed) {
      if (paymentStatus === 'cancelled') stats.cancelled++
      else stats.rejected++
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}
