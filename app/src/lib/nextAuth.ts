import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';

export async function auth() {
  return getServerSession(authOptions);
}
