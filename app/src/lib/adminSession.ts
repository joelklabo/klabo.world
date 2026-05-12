import { redirect } from 'next/navigation';
import { auth } from './nextAuth';
import { cache } from 'react';

export const getAdminSession = cache(async () => auth());

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session?.user?.email) {
    redirect('/admin');
  }
  return session;
}
