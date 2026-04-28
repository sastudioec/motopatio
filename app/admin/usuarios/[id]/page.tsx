import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { formatFechaCorta as fmtFechaCorta, formatFechaHora as fmtFecha } from '@/lib/format-date'
import UserActions from './UserActions'

export const dynamic = 'force-dynamic'

const fmtMoneda = (cents: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(cents / 100)

export default async function AdminUsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const auth = await requireAdmin()
  if (!auth.ok) redirect('/auth/login')

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: { select: { provider: true } },
      _count: { select: { listings: true, payments: true, leadsEnviados: true } },
      dealer: {
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      listings: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, slug: true, marca: true, modelo: true, anio: true,
          estado: true, planTipo: true, precio: true, createdAt: true,
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, concept: true, planTipo: true, amountCents: true,
          status: true, payphoneTransactionId: true, createdAt: true,
        },
      },
      leadsEnviados: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, tipo: true, estado: true, createdAt: true,
          listing: { select: { slug: true, marca: true, modelo: true, anio: true } },
        },
      },
      listingAudits: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, action: true, createdAt: true,
          listing: { select: { id: true, slug: true, marca: true, modelo: true } },
        },
      },
    },
  })

  if (!user) notFound()

  // DealerApplication suelta — el user llenó el formulario público pero
  // todavía no creó Dealer (el linkeo automático de createDealer aún no
  // corrió). Tiene sentido sólo si user no tiene Dealer.
  const looseApplication = user.dealer
    ? null
    : await prisma.dealerApplication.findFirst({
        where: { email: user.email.toLowerCase(), dealerId: null },
        orderBy: { createdAt: 'desc' },
      })

  const provider = user.accounts.length > 0
    ? user.accounts.map((a) => a.provider).join(', ')
    : 'credentials'
  const initial = (user.name || user.email).charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f4' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
        <Link
          href="/admin?tab=usuarios"
          style={{
            display: 'inline-block', marginBottom: 16,
            color: '#1E2340', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}
        >
          ← Volver a usuarios
        </Link>

        {/* Header */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {user.avatar || user.image ? (
              <img
                src={user.avatar || user.image || ''}
                alt=""
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#E8390E', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900,
              }}>{initial}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'Poppins,sans-serif', fontSize: 22, fontWeight: 900,
                color: '#1E2340', margin: '0 0 4px',
              }}>{user.name || 'Sin nombre'} {user.lastName || ''}</h1>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{user.email}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge label={user.role} variant={user.role === 'admin' ? 'admin' : user.role === 'dealer' ? 'dealer' : 'user'} />
                {user.blocked && <Badge label="Bloqueado" variant="danger" />}
                {user.emailVerified && <Badge label="Email verificado" variant="success" />}
                {!user.emailVerified && <Badge label="Email sin verificar" variant="warn" />}
                {user.cedulaVerified && <Badge label="Cédula ✓" variant="success" />}
                {user.phoneVerified && <Badge label="Teléfono ✓" variant="success" />}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#888' }}>
              <div>Registrado:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E2340' }}>{fmtFechaCorta(user.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Perfil + Acciones */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }} className="admin-user-grid">
          <div style={cardStyle}>
            <SectionTitle>Perfil</SectionTitle>
            <DataGrid>
              <DataRow label="Teléfono" value={user.phone || '—'} />
              <DataRow label="Provincia" value={user.provincia || '—'} />
              <DataRow label="Ciudad" value={user.ciudad || '—'} />
              <DataRow label="Género" value={user.gender || '—'} />
              <DataRow label="Fecha nacimiento" value={fmtFechaCorta(user.birthDate)} />
              <DataRow label="Provider" value={provider} />
              <DataRow label="Última publicación gratis" value={fmtFecha(user.lastFreePublicationAt)} />
              <DataRow label="Última actualización" value={fmtFecha(user.updatedAt)} />
            </DataGrid>
            {user.bio && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 6, fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Bio</div>
                {user.bio}
              </div>
            )}
          </div>
          <div style={cardStyle}>
            <SectionTitle>Acciones</SectionTitle>
            <UserActions
              userId={user.id}
              role={user.role}
              blocked={user.blocked}
              dealerSlug={user.dealer?.slug || null}
            />
          </div>
        </div>

        {/* Dealer info */}
        {user.dealer && (
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <SectionTitle>Concesionario</SectionTitle>
            <DataGrid>
              <DataRow label="Nombre comercial" value={user.dealer.nombreComercial} />
              <DataRow label="Slug" value={
                <Link href={`/dealers/${user.dealer.slug}`} target="_blank" style={{ color: '#E8390E', fontWeight: 700 }}>
                  /dealers/{user.dealer.slug} ↗
                </Link>
              } />
              <DataRow label="RUC" value={user.dealer.ruc || '—'} />
              <DataRow label="Razón social" value={user.dealer.razonSocial || '—'} />
              <DataRow label="Estado aprobación" value={
                user.dealer.approvalStatus === 'approved' ? '✅ Aprobado'
                : user.dealer.approvalStatus === 'rejected' ? '❌ Rechazado'
                : '⏳ Pendiente'
              } />
              <DataRow label="Suscripción" value={user.dealer.subscriptionStatus} />
              <DataRow label="Trial vence" value={fmtFechaCorta(user.dealer.trialEndsAt)} />
              <DataRow label="Activo" value={user.dealer.activo ? 'Sí' : 'No'} />
            </DataGrid>
            {user.dealer.applications[0] && (
              <div style={{
                marginTop: 14, background: '#FFF5F0', border: '1px solid #FFD2BD',
                borderLeft: '4px solid #E8390E', borderRadius: 6, padding: '10px 14px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#E8390E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  📋 Llegó desde el formulario público
                </div>
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>
                  <div><strong>Negocio:</strong> {user.dealer.applications[0].businessName}</div>
                  <div><strong>Stock declarado:</strong> {user.dealer.applications[0].stockRange}</div>
                  {user.dealer.applications[0].message && (
                    <div><strong>Mensaje:</strong> {user.dealer.applications[0].message}</div>
                  )}
                  <div><strong>Fecha solicitud:</strong> {fmtFechaCorta(user.dealer.applications[0].createdAt)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DealerApplication suelta (sin Dealer todavía) */}
        {looseApplication && (
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <SectionTitle>Solicitud de concesionario (sin cuenta dealer todavía)</SectionTitle>
            <DataGrid>
              <DataRow label="Negocio" value={looseApplication.businessName} />
              <DataRow label="Contacto" value={looseApplication.contactName} />
              <DataRow label="Email" value={looseApplication.email} />
              <DataRow label="Teléfono" value={looseApplication.phone} />
              <DataRow label="Ciudad" value={looseApplication.city} />
              <DataRow label="Stock" value={looseApplication.stockRange} />
              <DataRow label="Estado" value={looseApplication.status} />
              <DataRow label="Fecha" value={fmtFechaCorta(looseApplication.createdAt)} />
            </DataGrid>
            {looseApplication.message && (
              <div style={{ marginTop: 10, fontSize: 13, color: '#444', lineHeight: 1.5, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
                <strong>Mensaje:</strong> {looseApplication.message}
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionTitle>
            Listings <Count n={user._count.listings} />
          </SectionTitle>
          {user.listings.length === 0 ? (
            <Empty text="Este usuario no tiene listings publicados todavía." />
          ) : (
            <Table headers={['Marca', 'Modelo', 'Año', 'Estado', 'Plan', 'Precio', 'Creado', '']}>
              {user.listings.map((l) => (
                <tr key={l.id}>
                  <td style={tdStyle}>{l.marca}</td>
                  <td style={tdStyle}>{l.modelo}</td>
                  <td style={tdStyle}>{l.anio}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                      background: l.estado === 'activo' ? '#D1FAE5' : l.estado === 'vendido' ? '#FEF3C7' : '#f4f4f4',
                      color: l.estado === 'activo' ? '#065F46' : l.estado === 'vendido' ? '#78350F' : '#666',
                    }}>{l.estado}</span>
                  </td>
                  <td style={tdStyle}>{l.planTipo}</td>
                  <td style={tdStyle}>${l.precio.toLocaleString()}</td>
                  <td style={tdStyle}>{fmtFechaCorta(l.createdAt)}</td>
                  <td style={tdStyle}>
                    {l.slug ? (
                      <a href={`/motos/${l.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#E8390E', fontWeight: 700, fontSize: 12 }}>Ver ↗</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {/* Pagos */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionTitle>
            Pagos <Count n={user._count.payments} />
          </SectionTitle>
          {user.payments.length === 0 ? (
            <Empty text="Este usuario no tiene pagos registrados." />
          ) : (
            <Table headers={['Concepto', 'Plan', 'Monto', 'Estado', 'PayPhone TX', 'Creado']}>
              {user.payments.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.concept}</td>
                  <td style={tdStyle}>{p.planTipo || '—'}</td>
                  <td style={tdStyle}>{fmtMoneda(p.amountCents)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                      background: p.status === 'approved' ? '#D1FAE5' : p.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                      color: p.status === 'approved' ? '#065F46' : p.status === 'pending' ? '#78350F' : '#7F1D1D',
                    }}>{p.status}</span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{p.payphoneTransactionId || '—'}</td>
                  <td style={tdStyle}>{fmtFechaCorta(p.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {/* Leads enviados */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionTitle>
            Leads enviados <Count n={user._count.leadsEnviados} />
          </SectionTitle>
          {user.leadsEnviados.length === 0 ? (
            <Empty text="Este usuario no ha enviado leads todavía." />
          ) : (
            <Table headers={['Listing', 'Canal', 'Estado', 'Cuándo']}>
              {user.leadsEnviados.map((lead) => (
                <tr key={lead.id}>
                  <td style={tdStyle}>
                    {lead.listing ? (
                      lead.listing.slug ? (
                        <a href={`/motos/${lead.listing.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#E8390E', fontWeight: 700 }}>
                          {lead.listing.marca} {lead.listing.modelo} {lead.listing.anio} ↗
                        </a>
                      ) : `${lead.listing.marca} ${lead.listing.modelo} ${lead.listing.anio}`
                    ) : '— (listing eliminado)'}
                  </td>
                  <td style={tdStyle}>{lead.tipo}</td>
                  <td style={tdStyle}>{lead.estado}</td>
                  <td style={tdStyle}>{fmtFechaCorta(lead.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {/* Audit */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <SectionTitle>Audit (últimos 50)</SectionTitle>
          {user.listingAudits.length === 0 ? (
            <Empty text="Sin acciones de audit registradas." />
          ) : (
            <Table headers={['Acción', 'Listing', 'Cuándo']}>
              {user.listingAudits.map((a) => (
                <tr key={a.id}>
                  <td style={tdStyle}>{a.action}</td>
                  <td style={tdStyle}>
                    {a.listing ? (
                      a.listing.slug ? (
                        <a href={`/motos/${a.listing.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#E8390E', fontWeight: 700 }}>
                          {a.listing.marca} {a.listing.modelo} ↗
                        </a>
                      ) : `${a.listing.marca} ${a.listing.modelo}`
                    ) : '— (eliminado)'}
                  </td>
                  <td style={tdStyle}>{fmtFecha(a.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .admin-user-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8',
  padding: '18px 20px',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: '#1E2340', borderBottom: '1px solid #f4f4f4',
}

function Badge({ label, variant }: { label: string; variant: 'admin' | 'dealer' | 'user' | 'success' | 'warn' | 'danger' }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    admin: { bg: '#EEF2FF', fg: '#4338CA' },
    dealer: { bg: '#FEF3C7', fg: '#78350F' },
    user: { bg: '#f4f4f4', fg: '#666' },
    success: { bg: '#D1FAE5', fg: '#065F46' },
    warn: { bg: '#FEF3C7', fg: '#78350F' },
    danger: { bg: '#FCEBEB', fg: '#A32D2D' },
  }
  const c = palette[variant]
  return (
    <span style={{
      background: c.bg, color: c.fg,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    }}>{label}</span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'Poppins,sans-serif', fontSize: 14, fontWeight: 800,
      color: '#1E2340', textTransform: 'uppercase', letterSpacing: 0.5,
      margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
    </h2>
  )
}

function Count({ n }: { n: number }) {
  return (
    <span style={{
      background: '#f4f4f4', color: '#666',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
    }}>{n}</span>
  )
}

function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 16px' }}>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E2340', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: '24px', textAlign: 'center', color: '#888',
      background: '#fafafa', border: '1px dashed #d0d0d0', borderRadius: 6,
      fontSize: 13,
    }}>
      {text}
    </div>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px', fontSize: 11, fontWeight: 800,
                color: '#666', textTransform: 'uppercase', textAlign: 'left',
                borderBottom: '1px solid #e8e8e8',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
