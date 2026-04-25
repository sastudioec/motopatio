'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPlanCopy, getPlanCtaLabel, type PlanForCopy } from '@/lib/plan-copy'

type PlanDTO = PlanForCopy & {
  isActive: boolean
  sortOrder: number
}

const PLAN_COLOR: Record<string, string> = {
  gratis: '#6b7280',
  basico: '#1E2340',
  full: '#E8390E',
}

export default function PreciosClient() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<PlanDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: '36px',
              fontWeight: 900,
              color: '#1E2340',
              marginBottom: '8px',
            }}
          >
            Planes de <span style={{ color: '#E8390E' }}>publicación</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#666' }}>
            Elige el plan que mejor se adapte a ti. Servicio digital de publicación de anuncios clasificados.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando planes...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
              gap: '20px',
              marginBottom: '48px',
            }}
          >
            {plans.map((plan) => {
              const copy = getPlanCopy(plan)
              const color = PLAN_COLOR[plan.id] || '#1E2340'
              const isPopular = !!copy.badge
              const isFree = plan.priceCents === 0
              const ctaLabel = getPlanCtaLabel(plan)
              return (
                <div
                  key={plan.id}
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: isPopular ? '2px solid #E8390E' : '1px solid #e8e8e8',
                    position: 'relative',
                  }}
                >
                  {copy.badge && (
                    <div
                      style={{
                        background: '#E8390E',
                        color: 'white',
                        textAlign: 'center',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {copy.badge}
                    </div>
                  )}
                  <div style={{ padding: '28px 24px' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                      }}
                    >
                      {plan.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Poppins,sans-serif',
                        fontSize: '40px',
                        fontWeight: 900,
                        color: '#1E2340',
                        marginBottom: '4px',
                      }}
                    >
                      {isFree ? 'Gratis' : '$' + (plan.priceCents / 100).toFixed(0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
                      por publicación · {plan.durationDays} días
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      {copy.features.map((f) =>
                        f.highlight ? (
                          <div
                            key={f.text}
                            style={{
                              background: '#fff4e6',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              marginBottom: '8px',
                              fontSize: '13px',
                              color: '#E8390E',
                              fontWeight: 700,
                            }}
                          >
                            {f.text}
                          </div>
                        ) : (
                          <div
                            key={f.text}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              fontSize: '13px',
                              color: '#333',
                            }}
                          >
                            <span style={{ color: '#0F6E56', fontWeight: 700 }}>✓</span> {f.text}
                          </div>
                        )
                      )}
                      {copy.noFeatures.map((f) => (
                        <div
                          key={f}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: '#aaa',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>✗</span> {f}
                        </div>
                      ))}
                    </div>

                    <Link
                      href={session ? '/publicar?plan=' + plan.id : '/auth/registro'}
                      style={{
                        display: 'block',
                        background: isPopular ? '#E8390E' : '#1E2340',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                      }}
                    >
                      {ctaLabel}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          style={{
            background: '#1E2340',
            borderRadius: '8px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⭐</span>
              <div
                style={{
                  fontFamily: 'Poppins,sans-serif',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                Add-on Destacado
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#7a82a0', maxWidth: '400px' }}>
              Disponible para planes Básico y Full (cuando venza su destacado incluido). Tu anuncio aparece primero en el catálogo y en el home por 7 días.{' '}
              <strong style={{ color: '#fff' }}>Compra única, no se renueva automáticamente.</strong>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'Poppins,sans-serif',
                fontSize: '36px',
                fontWeight: 900,
                color: '#E8390E',
              }}
            >
              $7
            </div>
            <div style={{ fontSize: '12px', color: '#7a82a0' }}>por 7 días</div>
          </div>
        </div>

        <div
          style={{
            background: '#fff8e6',
            border: '1px solid #f5c451',
            borderLeft: '4px solid #E8390E',
            borderRadius: '8px',
            padding: '18px 22px',
            marginTop: '24px',
          }}
        >
          <p style={{ color: '#1a1f36', fontSize: '13px', lineHeight: 1.6, margin: 0, fontWeight: 700 }}>
            ℹ️ Sobre nuestros planes
          </p>
          <p style={{ color: '#444', fontSize: '13px', lineHeight: 1.6, margin: '6px 0 0 0' }}>
            Todos los planes corresponden al <strong>servicio digital de publicación de anuncios clasificados</strong>. MotoPatio <strong>no vende vehículos, no intermedia transacciones, no recibe pagos entre usuarios ni cobra comisión alguna sobre ventas</strong>. Los planes Básico y Full son pagos únicos por publicación; no hay suscripciones ni cargos recurrentes. Cuando tu publicación expire, puedes republicarla manualmente si aún no has vendido tu vehículo. Consulta nuestra{' '}
            <Link href="/politica-de-reembolsos" style={{ color: '#E8390E', fontWeight: 600 }}>
              política de reembolsos
            </Link>
            .
          </p>
        </div>

        <div style={{ marginTop: '48px' }}>
          <h2
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: '20px',
              fontWeight: 900,
              color: '#1E2340',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Preguntas frecuentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { q: '¿Puedo tener más de un anuncio activo?', r: 'Sí. Cada anuncio tiene su propio plan independiente y puedes tener varios publicados simultáneamente.' },
              { q: '¿Las publicaciones se renuevan automáticamente?', r: 'No. Todos los planes son pagos únicos por publicación. Cuando tu anuncio expira, se desactiva automáticamente. Si aún no has vendido tu vehículo, puedes republicarlo manualmente desde "Mis publicaciones" eligiendo el plan que prefieras.' },
              { q: '¿Puedo cambiar de plan después de publicar?', r: 'No directamente sobre un anuncio activo. Si quieres cambiar de plan, espera a que tu publicación actual expire y republica eligiendo el nuevo plan. Alternativamente, puedes comprar el Add-on Destacado para mejorar la visibilidad de un anuncio Básico activo.' },
              { q: '¿Qué pasa cuando expira mi publicación?', r: 'Al cumplirse el plazo del plan, el anuncio se desactiva automáticamente. Puedes volver a publicarlo manualmente desde "Mis publicaciones" eligiendo un nuevo plan y haciendo un nuevo pago único.' },
              { q: '¿Cómo funciona el destacado?', r: 'Los anuncios destacados aparecen primero en el catálogo y en la sección "Clasificado Destacado" del home durante 7 días.' },
              { q: '¿Cómo pago?', r: 'Los pagos se procesan de forma segura a través de PayPhone, pasarela certificada ecuatoriana. Aceptamos tarjetas de crédito y débito Visa, Mastercard y Diners Club de cualquier banco ecuatoriano. No necesitas descargar ninguna app: el pago se realiza directamente desde el sitio web.' },
              { q: '¿Cobran comisión si vendo mi vehículo?', r: 'No. Solo cobramos por el servicio de publicación del anuncio. No intervenimos en la transacción entre comprador y vendedor, ni cobramos porcentaje sobre el precio de venta.' },
            ].map((item) => (
              <div
                key={item.q}
                style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8e8e8' }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E2340', marginBottom: '6px' }}>
                  {item.q}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>{item.r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

