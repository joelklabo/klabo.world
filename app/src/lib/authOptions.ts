import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ensureAdminSeeded, verifyAdminCredentials } from './auth';
import { env } from './env';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
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
