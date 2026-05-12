import { redirect } from 'next/navigation';
import { getCachedSession } from './nextAuth';

export const getAdminSession = getCachedSession;

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session?.user?.email) {
    redirect('/admin');
  }
  return session;
}
