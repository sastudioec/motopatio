'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatFechaLarga } from '@/lib/format-date'

function ResultadoContent() {
  const params = useSearchParams()
  const router = useRouter()
  const status = params.get('status')
  const reason = params.get('reason')
  const paymentId = params.get('paymentId')
  const listingId = params.get('listingId')
  const type = params.get('type')
  const destacadoHasta = params.get('destacadoHasta')
  const planParam = params.get('plan')
  const isFeatured = type === 'featured'
  const isUpgrade = type === 'upgrade'
  const goesToMisMotos = isFeatured || isUpgrade

  const [countdown, setCountdown] = useState(5)

  // Redirect automatico tras pago exitoso
  useEffect(() => {
    if (status !== 'ok' || !listingId) return
    if (countdown <= 0) {
      router.push('/mis-motos')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, listingId, countdown, router])

  const box: React.CSSProperties = {
    maxWidth: '520px',
    margin: '60px auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '40px 32px',
    textAlign: 'center',
    border: '1px solid #e8e8e8',
  }
  const title: React.CSSProperties = {
    fontFamily: 'Poppins,sans-serif',
    fontSize: '24px',
    fontWeight: 900,
    marginBottom: '10px',
  }
  const msg: React.CSSProperties = {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '24px',
  }
  const btnPrimary: React.CSSProperties = {
    display: 'inline-block',
    background: '#E8390E',
    color: '#fff',
    padding: '12px 26px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    textDecoration: 'none',
  }
  const btnSecondary: React.CSSProperties = {
    display: 'inline-block',
    background: 'transparent',
    color: '#1E2340',
    padding: '12px 26px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textDecoration: 'none',
    border: '1px solid #1E2340',
    marginLeft: '8px',
  }

  if (status === 'ok') {
    const fecha = destacadoHasta ? formatFechaLarga(destacadoHasta) : null
    const planLabel =
      planParam === 'full' ? 'Full' : planParam === 'basico' ? 'Básico' : null
    const okTitle = isFeatured
      ? '¡Destacado activado!'
      : isUpgrade
        ? '¡Plan mejorado!'
        : '¡Pago aprobado!'
    const okIcon = isFeatured ? '⭐' : isUpgrade ? '🚀' : '✅'
    const okMsg = isFeatured
      ? (fecha
          ? `Tu anuncio estará destacado hasta el ${fecha}. Te enviamos un email de confirmación.`
          : 'Tu anuncio ya está destacado. Te enviamos un email de confirmación.')
      : isUpgrade
        ? (planLabel
            ? `Tu anuncio ahora es Plan ${planLabel}. El conteo arranca desde hoy. Te enviamos un email de confirmación.`
            : 'Tu plan fue mejorado. El conteo arranca desde hoy. Te enviamos un email de confirmación.')
        : 'Tu publicación ya está activa en MotoPatio. Te enviamos un email de confirmación.'
    return (
      <div style={{ minHeight: '100vh', background: '#f4f4f4', padding: '20px' }}>
        <div style={box}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>{okIcon}</div>
          <div style={{ ...title, color: '#16a34a' }}>{okTitle}</div>
          <div style={msg}>{okMsg}</div>
          <div style={{ ...msg, fontSize: '12px', color: '#888' }}>
            Serás redirigido a tus motos en {countdown} segundos...
          </div>
          <Link href="/mis-motos" style={btnPrimary}>Ver mis motos</Link>
          <Link href="/" style={btnSecondary}>Ir al inicio</Link>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f4f4', padding: '20px' }}>
        <div style={box}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>❌</div>
          <div style={{ ...title, color: '#dc2626' }}>Pago rechazado</div>
          <div style={msg}>
            Tu banco rechazó la transacción. No se realizó ningún cargo. Puedes intentar nuevamente con otra tarjeta.
          </div>
          <Link href={paymentId ? ((goesToMisMotos ? "/mis-motos?retry=" : "/publicar?retry=") + paymentId) : (goesToMisMotos ? "/mis-motos" : "/publicar")} style={btnPrimary}>Intentar de nuevo</Link>
          <Link href="/contacto" style={btnSecondary}>Contactar soporte</Link>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    // Mensaje diferenciado segun el reason que pone /api/pagos/confirmar
    // (mapPayphoneStatus en lib/payphone.ts).
    //   user_rejected: cancelacion pre-autorizacion -> sin cargo real.
    //   post_auth_cancel_or_reverso: PayPhone canceló con authorizationCode
    //     populated. Puede haber habido cobro real revertido, o un hold
    //     pre-3DS que se libera solo. Mensaje conservador.
    let cancelledMsg: string
    if (reason === 'user_rejected') {
      cancelledMsg = 'Cancelaste el pago. No se realizó ningún cargo en tu cuenta. Puedes intentar de nuevo cuando quieras.'
    } else if (reason === 'post_auth_cancel_or_reverso') {
      cancelledMsg = 'Tu pago fue cancelado. Si viste un cargo en tu banco, se revertirá automáticamente en los próximos días. Si no se revierte en 7 días, contáctanos en info@motopatio.com con tu número de transacción.'
    } else {
      cancelledMsg = 'Tu pago fue cancelado. Si viste un cargo en tu banco, se revertirá automáticamente en los próximos días. Si no se revierte en 7 días, contáctanos en info@motopatio.com con tu número de transacción.'
    }
    return (
      <div style={{ minHeight: '100vh', background: '#f4f4f4', padding: '20px' }}>
        <div style={box}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🚫</div>
          <div style={{ ...title, color: '#d97706' }}>Pago cancelado</div>
          <div style={msg}>{cancelledMsg}</div>
          {paymentId && (
            <div style={{ ...msg, fontSize: '11px', color: '#888' }}>
              Referencia: {paymentId}
            </div>
          )}
          <Link href={paymentId ? ((goesToMisMotos ? "/mis-motos?retry=" : "/publicar?retry=") + paymentId) : (goesToMisMotos ? "/mis-motos" : "/publicar")} style={btnPrimary}>Intentar de nuevo</Link>
          <Link href="/" style={btnSecondary}>Ir al inicio</Link>
        </div>
      </div>
    )
  }

  // status === 'error' o cualquier otro
  const reasonMsg: Record<string, string> = {
    params: 'Faltan parámetros en la URL de respuesta.',
    notfound: 'No encontramos tu transacción en nuestro sistema.',
    confirm: 'No pudimos confirmar el pago con PayPhone. Si te cobraron, contáctanos.',
    nodraft: 'Tu pago fue aprobado pero perdimos los datos de la moto. Contáctanos urgente.',
    noplan: 'Tu pago fue aprobado pero hubo un problema con el plan. Contáctanos urgente.',
    pending: 'Tu pago está siendo procesado. Te enviaremos un correo en cuanto tengamos la respuesta final, o puedes volver más tarde a revisar.',
    unknown: 'Estamos verificando el estado de tu pago con PayPhone. Si te cobraron, activaremos tu plan automáticamente en los próximos minutos. Puedes revisar el estado en /mis-motos.',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', padding: '20px' }}>
      <div style={box}>
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>⚠️</div>
        <div style={{ ...title, color: '#d97706' }}>Hubo un problema</div>
        <div style={msg}>
          {reason && reasonMsg[reason] ? reasonMsg[reason] : 'No pudimos procesar el resultado del pago.'}
        </div>
        {paymentId && (
          <div style={{ ...msg, fontSize: '11px', color: '#888' }}>
            Referencia: {paymentId}
          </div>
        )}
        <Link href="/contacto" style={btnPrimary}>Contactar soporte</Link>
        <Link href="/" style={btnSecondary}>Ir al inicio</Link>
      </div>
    </div>
  )
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
      <ResultadoContent />
    </Suspense>
  )
}
