import type { Session } from 'next-auth';
import { auth } from '@/lib/nextAuth';

export type TRPCContext = {
  session: Session | null;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  try {
    const session = await auth();
    return { session };
  } catch (error) {
    console.error('createTRPCContext error', error);
    return { session: null };
  }
}
