import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For demo purposes, check against a simple admin user
        // In production, you'd hash passwords properly
        if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
          
          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }
        }
        
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/signin',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }