'use client'

import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const STOCK_OPTIONS = ['1-10', '11-30', '31-50', '50+'] as const
type StockRange = (typeof STOCK_OPTIONS)[number]

const BENEFITS = [
  {
    icon: '🏪',
    title: 'Tu tienda digital',
    body:
      'Tu propia página dentro de Moto Patio con tu logo, banner, datos de contacto y catálogo completo de motos.',
  },
  {
    icon: '💬',
    title: 'Control de leads',
    body:
      'Recibe cada contacto con nombre, teléfono, ciudad y fecha. Exporta tu base completa cuando quieras.',
  },
  {
    icon: '📜',
    title: 'Transparencia total',
    body:
      'Historial completo de cada moto: cuándo la publicaste, quién la editó, cambios de precio, todo registrado. Cero sorpresas, control total de tu inventario.',
  },
]

const PLAN_ITEMS = [
  '60 días completamente gratis',
  'Hasta 20 motos publicadas al mismo tiempo',
  'Tu perfil público con dominio motopatio.com/dealers/tu-nombre',
  'Panel de gestión propio',
  'Captura automática de leads',
  'Historial de actividad de cada moto',
  'Acompañamiento directo del equipo de Moto Patio',
]

export default function ProgramaClient() {
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>('')
  const [city, setCity] = useState('')
  const [stockRange, setStockRange] = useState<StockRange | ''>('')
  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function emailValid(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
  }

  function valid(): boolean {
    if (businessName.trim().length < 2) return false
    if (contactName.trim().length < 2) return false
    if (!emailValid(email)) return false
    if (!phone || !isValidPhoneNumber(phone)) return false
    if (city.trim().length < 2) return false
    if (!stockRange) return false
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!valid()) {
      setError('Revisa los campos requeridos.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/dealers/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone,
          city: city.trim(),
          stockRange,
          message: message.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Error inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4', overflowX: 'hidden' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg,#1E2340 0%,#2a3050 100%)',
          color: '#fff',
          padding: '64px 20px 56px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(232,57,14,0.15)',
              color: '#FFB59A',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 20,
            }}
          >
            Programa de lanzamiento
          </span>
          <h1
            style={{
              fontFamily: 'Poppins,sans-serif',
              lineHeight: 1.05,
              margin: '0 0 20px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 'clamp(18px, 2.6vw, 24px)',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: 1,
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              Programa de
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 'clamp(28px, 8.5vw, 64px)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                margin: '4px 0 8px',
                wordBreak: 'normal',
                overflowWrap: 'anywhere',
              }}
            >
              Concesionarios
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 700,
                color: '#E8390E',
                fontStyle: 'italic',
              }}
            >
              Moto Patio
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#cfd2e0',
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 640,
            }}
          >
            Estamos invitando a los primeros concesionarios del Ecuador a sumarse{' '}
            <strong
              style={{
                color: '#E8390E',
                fontWeight: 800,
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                letterSpacing: 0.5,
              }}
            >
              DE FORMA GRATUITA
            </strong>
            .
          </p>
          <a
            href="#solicitud"
            style={{
              display: 'inline-block',
              marginTop: 28,
              background: '#E8390E',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              padding: '14px 32px',
              borderRadius: 8,
            }}
          >
            Solicitar acceso
          </a>
        </div>
      </section>

      {/* Beneficios */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 20px 24px' }}>
        <h2
          style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            fontWeight: 800,
            color: '#1E2340',
            textAlign: 'center',
            margin: '0 0 8px',
          }}
        >
          Lo que recibes al unirte
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            margin: '0 auto 32px',
            maxWidth: 560,
            lineHeight: 1.6,
          }}
        >
          Todas las herramientas que necesitas para vender más, en un solo lugar.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
            gap: 20,
          }}
        >
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #e8e8e8',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>{b.icon}</div>
              <h3
                style={{
                  fontFamily: 'Poppins,sans-serif',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#1E2340',
                  margin: '0 0 8px',
                }}
              >
                {b.title}
              </h3>
              <p style={{ fontSize: 14, color: '#52525b', lineHeight: 1.6, margin: 0 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* El plan */}
      <section style={{ background: '#E8390E', padding: 'clamp(48px, 7vw, 72px) 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              letterSpacing: 2,
              margin: '0 0 28px',
              textShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            EL PLAN
          </h2>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 'clamp(24px, 4vw, 36px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {PLAN_ITEMS.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 15,
                  color: '#1a1f36',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    color: '#22c55e',
                    fontWeight: 900,
                    fontSize: 18,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p
            style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.6,
              margin: '20px 0 0',
              padding: '14px 16px',
              background: '#f9f9fb',
              borderRadius: 8,
              borderLeft: '4px solid #E8390E',
            }}
          >
            Después de los 60 días te ofreceremos uno de nuestros planes mensuales. Sin sorpresas, te avisaremos antes.
          </p>
          </div>
        </div>
      </section>

      {/* Por qué solo a los primeros */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 40px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 'clamp(24px, 4vw, 32px)',
            border: '1px solid #e8e8e8',
          }}
        >
          <h2
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: 22,
              fontWeight: 800,
              color: '#1E2340',
              margin: '0 0 12px',
            }}
          >
            Eres parte de un grupo selecto
          </h2>
          <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.7, margin: 0 }}>
            No es casualidad que estés leyendo esto. Estamos eligiendo con cuidado a los primeros concesionarios del
            Ecuador que van a inaugurar este programa con nosotros. Buscamos a los mejores: los que tienen reputación,
            los que mueven inventario serio, los que sus clientes recomiendan. Por eso te contactamos. Sumarte ahora
            significa entrar en condiciones únicas, con acompañamiento directo del equipo y un lugar destacado dentro
            de Moto Patio desde el primer día.
          </p>
        </div>
      </section>

      {/* Separador */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ height: 2, background: '#E8390E', opacity: 0.5, borderRadius: 2 }} />
      </div>

      {/* Formulario */}
      <section id="solicitud" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 80px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 'clamp(24px, 4vw, 36px)',
            border: '1px solid #e8e8e8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2
                style={{
                  fontFamily: 'Poppins,sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#1E2340',
                  margin: '0 0 12px',
                }}
              >
                ¡Recibimos tu solicitud!
              </h2>
              <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.7, margin: 0 }}>
                Gabriela del equipo de Moto Patio te contactará en breve para conocer tu negocio y activar tu cuenta.
                Mientras tanto, prepara tu logo y un par de fotos buenas — te harán falta.
              </p>
            </div>
          ) : (
            <>
              <h2
                style={{
                  fontFamily: 'Poppins,sans-serif',
                  fontSize: 'clamp(20px, 3vw, 24px)',
                  fontWeight: 800,
                  color: '#1E2340',
                  margin: '0 0 8px',
                  textAlign: 'center',
                }}
              >
                Solicita tu acceso
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: '#666',
                  textAlign: 'center',
                  margin: '0 0 24px',
                  lineHeight: 1.6,
                }}
              >
                Déjanos tus datos y nos comunicamos contigo en menos de 48 horas.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <Field label="Nombre del concesionario" required>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej: Motos del Norte"
                    style={inputStyle}
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Nombre de contacto" required>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    style={inputStyle}
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    style={inputStyle}
                    maxLength={200}
                    required
                  />
                </Field>

                <Field label="Teléfono / WhatsApp" required>
                  <PhoneInput
                    international
                    defaultCountry="EC"
                    countryCallingCodeEditable={false}
                    value={phone}
                    onChange={setPhone}
                    className="mp-phone-input"
                    placeholder="99 123 4567"
                  />
                  <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>
                    Selecciona el país y escribe el número sin el código (lo agregamos automáticamente).
                  </p>
                </Field>

                <Field label="Ciudad" required>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: Quito"
                    style={inputStyle}
                    maxLength={120}
                    required
                  />
                </Field>

                <Field label="¿Cuántas motos tienen en stock aprox?" required>
                  <select
                    value={stockRange}
                    onChange={(e) => setStockRange(e.target.value as StockRange)}
                    style={inputStyle}
                    required
                  >
                    <option value="">Selecciona un rango</option>
                    {STOCK_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s} motos
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Mensaje (opcional)">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntanos algo de tu negocio o lo que quieras saber del programa."
                    style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                    maxLength={2000}
                  />
                </Field>

                {error && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                      margin: '0 0 16px',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: submitting ? '#888' : '#E8390E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '14px 20px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {submitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>

                <p
                  style={{
                    fontSize: 12,
                    color: '#888',
                    textAlign: 'center',
                    margin: '14px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  Al enviar aceptas que te contactemos por correo y WhatsApp para coordinar el ingreso al programa.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 700,
          color: '#1a1f36',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: '#E8390E', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid #d4d4d8',
  borderRadius: 8,
  fontSize: 15,
  color: '#1a1f36',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}
