import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import { sendWelcomeEmail, notifyAdmin } from '@/lib/emails'
import { cookies } from 'next/headers'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: { params: { prompt: 'select_account' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        if (!user.password) throw new Error("CUENTA_GOOGLE")
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return user
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login', error: '/auth/error' },
  events: {
    async createUser({ user }) {
      try {
        if (user.email && user.name) {
          await sendWelcomeEmail(user.email, user.name)
        }
      } catch (e) {
        console.error('Email bienvenida error:', e)
      }
      if (user.email) {
        try {
          const nombre = user.name || 'usuario'
          const adminBody = '<h3>Nuevo usuario</h3><ul>'
            + '<li><strong>Nombre:</strong> ' + nombre + '</li>'
            + '<li><strong>Email:</strong> ' + user.email + '</li>'
            + '<li><strong>Provider:</strong> google</li>'
            + '<li><strong>Verificado:</strong> sí</li>'
            + '</ul>'
          await notifyAdmin('[MotoPatio][Usuario] Nuevo: ' + nombre + ' (' + user.email + ')', adminBody)
        } catch (e) {
          console.error('[notifyAdmin] usuario google:', e)
        }
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true
      const cookieStore = await cookies()
      const intent = cookieStore.get('mp_intent')?.value
      const email = profile?.email || user.email
      if (!email) return true
      const existing = await prisma.user.findUnique({
        where: { email },
        include: { accounts: { select: { provider: true } } },
      })
      const hasGoogle = !!existing?.accounts.some(a => a.provider === 'google')
      const hasPassword = !!existing?.password
      if (intent === 'signup') {
        if (existing) return '/auth/error?reason=signup_email_exists'
        return true
      }
      if (intent === 'signin') {
        if (!existing) return '/auth/error?reason=signin_no_account'
        if (!hasGoogle && hasPassword) return '/auth/error?reason=signin_credentials_only'
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
        token.role = dbUser?.role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.id = token.sub ?? ''
        u.role = token.role
      }
      return session
    },
  },
}