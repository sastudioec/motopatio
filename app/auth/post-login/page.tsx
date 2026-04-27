import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Solo URLs relativas seguras: empiezan con "/" pero no con "//" o "/\"
// (evita open redirects tipo //evil.com).
function isSafeRelativeUrl(s: string | undefined | null): boolean {
  if (!s) return false
  if (!s.startsWith('/')) return false
  if (s.startsWith('//') || s.startsWith('/\\')) return false
  return true
}

export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/auth/login')
  }

  // Prioridad 1: next explicito (si es seguro)
  if (sp.next && isSafeRelativeUrl(sp.next)) {
    redirect(sp.next)
  }

  // Prioridad 2: por rol
  const role = (session.user as any).role
  if (role === 'dealer') redirect('/mi-tienda')
  redirect('/')
}
