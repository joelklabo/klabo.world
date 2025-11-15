import { redirect } from 'next/navigation';
import { auth } from './nextAuth';

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/admin');
  }
  return session;
}
