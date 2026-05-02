'use client'

import { useState } from 'react'

type BrandHeaderProps = {
  name: string
  origin: string
  logo: string
  site?: string
}

export function BrandHeader({ name, origin, logo, site }: BrandHeaderProps) {
  const [logoError, setLogoError] = useState(false)
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 18px',
        background: '#fafafa',
        border: '1px solid #ececec',
        borderRadius: '10px',
        margin: '20px 0 14px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '12px',
          background: '#fff',
          border: '1px solid #ececec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {logoError ? (
          <span
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: '#1E2340',
            }}
          >
            {initial}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={`Logo ${name}`}
            onError={() => setLogoError(true)}
            style={{
              maxWidth: '52px',
              maxHeight: '52px',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'Poppins,sans-serif',
              fontSize: '22px',
              fontWeight: 800,
              color: '#1E2340',
              lineHeight: 1.2,
            }}
          >
            {name}
          </span>
          <span style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden="true">
            {origin}
          </span>
        </div>
        {site && (
          <a
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              color: '#E8390E',
              textDecoration: 'none',
              marginTop: '2px',
              display: 'inline-block',
            }}
          >
            {site.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
          </a>
        )}
      </div>
    </div>
  )
}

type Model = {
  name: string
  photo: string
  price?: string
  description?: string
}

type ModelGridProps = {
  models: Model[]
}

export function ModelGrid({ models }: ModelGridProps) {
  if (!models || models.length === 0) {
    return (
      <div style={{ padding: '12px', background: '#fff5f0', border: '1px dashed #E8390E', borderRadius: '6px', fontSize: '13px', color: '#E8390E', margin: '14px 0' }}>
        ⚠️ ModelGrid recibió models=undefined — revisar parsing MDX
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '14px',
        margin: '14px 0 22px',
      }}
    >
      {models.map((m) => (
        <ModelCard key={m.name} model={m} />
      ))}
    </div>
  )
}

function ModelCard({ model }: { model: Model }) {
  const [photoError, setPhotoError] = useState(false)

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ececec',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 10',
          background:
            'linear-gradient(135deg, #f5f5f7 0%, #ececec 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {photoError ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: '#9aa0a6',
            }}
          >
            <span style={{ fontSize: '32px', lineHeight: 1 }} aria-hidden="true">
              🏍️
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'Poppins,sans-serif',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}
            >
              Foto próximamente
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.photo}
            alt={model.name}
            onError={() => setPhotoError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontFamily: 'Poppins,sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1E2340',
            lineHeight: 1.3,
          }}
        >
          {model.name}
        </span>
        {model.description && (
          <span style={{ fontSize: '12px', color: '#5a6072', lineHeight: 1.4 }}>
            {model.description}
          </span>
        )}
        {model.price && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#E8390E',
              marginTop: '2px',
            }}
          >
            {model.price}
          </span>
        )}
      </div>
    </div>
  )
}
