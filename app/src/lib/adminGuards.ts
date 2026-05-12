import { requireAdminSession } from '@/lib/adminSession';

type SessionResult = Awaited<ReturnType<typeof requireAdminSession>>;
export type AdminSessionResult = SessionResult;

export function isRedirectError(error: unknown): error is { digest: string } {
  return (
    !!error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

type AdminSessionHandler<T> = (session: SessionResult) => Promise<T>;

type AdminSessionErrorHandler<T> = (error: unknown) => Promise<T> | T;

export async function runWithAdminSession<T>(
  handler: AdminSessionHandler<T>,
  onError: AdminSessionErrorHandler<T>,
): Promise<T> {
  try {
    const session = await requireAdminSession();
    return await handler(session);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return onError(error);
  }
}
