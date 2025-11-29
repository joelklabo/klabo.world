import type { Session } from 'next-auth';
import { appRouter } from './router';
import type { TRPCContext } from './context';

/**
 * Creates a server-side tRPC caller with the current NextAuth session injected.
 * Use inside server actions/route handlers to avoid HTTP round-trips.
 */
export async function createServerCaller(options?: {
  session?: Session | null;
  skipAuth?: boolean;
  overrides?: Partial<TRPCContext>;
}) {
  const { session, skipAuth, overrides } = options ?? {};
  const baseCtx = skipAuth
    ? { session: session ?? null }
    : await (await import('./context')).createTRPCContext();
  const ctx = { ...baseCtx, session: session ?? baseCtx.session, ...overrides };
  return appRouter.createCaller(ctx);
}
