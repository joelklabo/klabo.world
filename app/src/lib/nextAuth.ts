import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { cache } from 'react';

export const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

export async function auth() {
  return getCachedSession();
}
