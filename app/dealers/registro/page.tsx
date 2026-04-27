import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { dealersEnabled } from '@/lib/dealer-flags'
import { prisma } from '@/lib/prisma'
import DealerOnboardingWizard from '@/app/components/DealerOnboardingWizard'

export const metadata = {
  title: 'Regístrate como concesionario | MotoPatio',
  description: 'Suma tu concesionario al directorio de MotoPatio. 60 días de prueba gratuita.',
}

export const dynamic = 'force-dynamic'

export default async function DealerRegistroPage() {
  if (!dealersEnabled()) notFound()

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/auth/login?next=/dealers/registro')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, blocked: true, dealer: { select: { slug: true } } },
  })

  if (!user || user.blocked) {
    redirect('/auth/login?next=/dealers/registro')
  }

  if (user.role === 'admin') {
    return (
      <main style={{ maxWidth: 540, margin: '60px auto', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#1E2340', fontSize: '22px', marginBottom: '12px' }}>
          Las cuentas administrativas no pueden registrarse como concesionario
        </h1>
        <p style={{ color: '#666' }}>
          Crea una cuenta separada con un email diferente para registrar un concesionario.
        </p>
      </main>
    )
  }

  if (user.role === 'dealer') {
    redirect(user.dealer ? '/mi-tienda' : '/auth/login?next=/mi-tienda')
  }

  return (
    <main style={{ background: '#f7f7f8', minHeight: '60vh', padding: '40px 0' }}>
      <header style={{ maxWidth: 720, margin: '0 auto 24px', padding: '0 20px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: 900, color: '#1E2340',
          fontFamily: 'Montserrat,sans-serif', margin: '0 0 6px',
        }}>
          Regístrate como concesionario
        </h1>
        <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
          Completa los dos pasos. Vas a tener <strong>60 días de prueba gratuita</strong> y nuestro equipo
          revisará tu documentación para aprobar tu cuenta.
        </p>
      </header>
      <DealerOnboardingWizard />
    </main>
  )
}
