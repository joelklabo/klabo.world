import { redirect } from 'next/navigation';
import { auth } from './nextAuth';

export async function getAdminSession() {
  return auth();
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session?.user?.email) {
    redirect('/admin');
  }
  return session;
}
