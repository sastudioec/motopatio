import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { dealersEnabled } from '@/lib/dealer-flags'
import { getDealerBySlug } from '@/lib/dealers'
import { prisma } from '@/lib/prisma'
import DealerHero from '@/app/components/DealerHero'
import MotoCard from '@/app/components/MotoCard'
import DealerWhatsAppButton from '@/app/components/DealerWhatsAppButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  if (!dealersEnabled()) return {}
  const { slug } = await params
  const dealer = await getDealerBySlug(slug)
  if (!dealer || !dealer.activo || dealer.approvalStatus !== 'approved') return {}
  const title = dealer.nombreComercial + ' — Concesionario en ' + dealer.ciudad + ' | MotoPatio'
  const description = dealer.descripcion?.slice(0, 160)
    || `Conoce las motos disponibles en ${dealer.nombreComercial}, concesionario de motos en ${dealer.ciudad}, ${dealer.provincia}.`
  const image = dealer.bannerImage || dealer.logo || undefined
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://motopatio.com/dealers/' + dealer.slug,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function DealerPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!dealersEnabled()) notFound()
  const { slug } = await params
  const dealer = await getDealerBySlug(slug)
  if (!dealer || !dealer.activo || dealer.approvalStatus !== 'approved') notFound()

  const redes = (dealer.redes as Record<string, string> | null) || null

  const listings = await prisma.listing.findMany({
    where: { dealerId: dealer.id, estado: 'activo' },
    orderBy: [{ destacadoHasta: 'desc' }, { createdAt: 'desc' }],
  })
  // Inyectamos el dealer en cada listing para que MotoCard renderice el badge.
  const dealerForBadge = {
    id: dealer.id,
    slug: dealer.slug,
    nombreComercial: dealer.nombreComercial,
    verificado: dealer.verificado,
    approvalStatus: dealer.approvalStatus,
  }
  const listingsWithDealer = listings.map(l => ({ ...l, dealer: dealerForBadge }))

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh' }}>
      <DealerHero dealer={dealer} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '20px',
        }}>
          <div>
            {dealer.descripcion && (
              <Section title="Sobre nosotros">
                <p style={{ margin: 0, color: '#3f3f46', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {dealer.descripcion}
                </p>
              </Section>
            )}

            <Section title={`Anuncios (${listingsWithDealer.length})`}>
              {listingsWithDealer.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center', color: '#888',
                  background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: '6px',
                }}>
                  Este concesionario todavía no publicó anuncios.
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '14px',
                  }}>
                    {listingsWithDealer.map((l: any) => (
                      <MotoCard key={l.id} l={l} />
                    ))}
                  </div>
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <a
                      href={`/motos?dealer=${dealer.slug}`}
                      style={{
                        display: 'inline-block', background: '#1E2340', color: '#fff',
                        padding: '12px 22px', borderRadius: 4, textDecoration: 'none',
                        fontSize: 13, fontWeight: 800, textTransform: 'uppercase',
                      }}
                    >
                      Ver todas las motos de {dealer.nombreComercial} →
                    </a>
                  </div>
                </>
              )}
            </Section>

            {dealer.googleMapsUrl && (
              <Section title="Ubicación">
                <a href={dealer.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-block', background: '#1E2340', color: '#fff',
                    padding: '10px 20px', borderRadius: '4px', textDecoration: 'none',
                    fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
                  }}>
                  📍 Ver en Google Maps
                </a>
              </Section>
            )}
          </div>

          <aside>
            <Section title="Contacto">
              <ContactRow label="Ciudad" value={`${dealer.ciudad}, ${dealer.provincia}`} />
              {dealer.direccion && <ContactRow label="Dirección" value={dealer.direccion} />}
              {dealer.telefono && (
                <ContactRow
                  label="Teléfono"
                  value={<a href={`tel:${dealer.telefono}`} style={linkStyle}>{dealer.telefono}</a>}
                />
              )}
              {dealer.whatsapp && (
                <div style={{ margin: '12px 0' }}>
                  <DealerWhatsAppButton
                    dealerId={dealer.id}
                    dealerSlug={dealer.slug}
                    whatsapp={dealer.whatsapp}
                    nombreComercial={dealer.nombreComercial}
                  />
                </div>
              )}
              {dealer.emailContacto && (
                <ContactRow
                  label="Email"
                  value={<a href={`mailto:${dealer.emailContacto}`} style={linkStyle}>{dealer.emailContacto}</a>}
                />
              )}
              {dealer.sitioWeb && (
                <ContactRow
                  label="Web"
                  value={<a href={dealer.sitioWeb} target="_blank" rel="noopener noreferrer" style={linkStyle}>{dealer.sitioWeb}</a>}
                />
              )}
              {redes && (Object.keys(redes).length > 0) && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {redes.instagram && <SocialLink platform="Instagram" handle={redes.instagram} />}
                  {redes.facebook && <SocialLink platform="Facebook" handle={redes.facebook} />}
                  {redes.tiktok && <SocialLink platform="TikTok" handle={redes.tiktok} />}
                </div>
              )}
            </Section>
          </aside>
        </div>
      </div>
    </main>
  )
}

const linkStyle: React.CSSProperties = { color: '#E8390E', textDecoration: 'none', fontWeight: 600 }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px',
      padding: '20px', marginBottom: '16px',
    }}>
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E2340', margin: '0 0 12px', textTransform: 'uppercase' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function ContactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ margin: '8px 0' }}>
      <div style={{ fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#1E2340' }}>{value}</div>
    </div>
  )
}

function SocialLink({ platform, handle }: { platform: string; handle: string }) {
  // Normalizar @ a URL aproximada (no validamos que la cuenta exista)
  const clean = handle.replace(/^@/, '')
  const href =
    platform === 'Instagram' ? `https://instagram.com/${clean}`
    : platform === 'Facebook' ? `https://facebook.com/${clean}`
    : platform === 'TikTok' ? `https://tiktok.com/@${clean}`
    : '#'
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        background: '#f4f4f5', color: '#1E2340',
        padding: '6px 12px', borderRadius: '999px',
        textDecoration: 'none', fontSize: '12px', fontWeight: 700,
      }}>
      {platform}
    </a>
  )
}
