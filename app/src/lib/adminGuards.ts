import { requireAdminSession } from '@/lib/adminSession';

export type AdminSessionResult = Awaited<ReturnType<typeof requireAdminSession>>;

export function isRedirectError(error: unknown): error is { digest: string } {
  return (
    !!error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

type AdminSessionHandler<T> = (session: AdminSessionResult) => Promise<T>;

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
