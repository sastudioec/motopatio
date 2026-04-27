import Link from 'next/link'

export default function PublicarDealerRejected() {
  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', background: '#fff', border: '1px solid #FEE2E2', borderRadius: 8, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E2340', margin: '0 0 12px' }}>
          Tu cuenta no fue aprobada
        </h1>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, margin: '0 0 18px' }}>
          Por ahora no puedes publicar motos en MotoPatío.
          Contáctanos a <a href="mailto:info@motopatio.com" style={{ color: '#E8390E', fontWeight: 700 }}>info@motopatio.com</a> para revisar tu caso.
        </p>
        <Link href="/mi-tienda" style={{ display: 'inline-block', background: '#1E2340', color: '#fff', padding: '12px 22px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase' }}>
          Volver al panel
        </Link>
      </div>
    </main>
  )
}
