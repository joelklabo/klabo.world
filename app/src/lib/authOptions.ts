import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ensureAdminSeeded, verifyAdminCredentials } from './auth';
import { env } from './env';

const ONE_HOUR = 60 * 60;
const TWELVE_HOURS = 12 * ONE_HOUR;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: TWELVE_HOURS,
    updateAge: ONE_HOUR,
  },
  jwt: {
    maxAge: TWELVE_HOURS,
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await ensureAdminSeeded();
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }
        const ok = await verifyAdminCredentials(email, password);
        if (!ok) {
          return null;
        }
        return { id: email, email };
      },
    }),
  ],
};
