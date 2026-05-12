import { requireAdminSession } from '@/lib/adminSession';
import { type ActionState } from '@/lib/formActions';
import { redirect } from 'next/navigation';

function isRedirectError(error: unknown): error is { digest: string } {
  return !!(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export { isRedirectError };

export function getFormSlug(formData: FormData, resourceLabel: string): string {
  const slug = formData.get('slug')?.toString().trim();
  if (!slug) {
    throw new Error(`Missing ${resourceLabel} slug`);
  }
  return slug;
}

export async function runAdminAction(
  action: () => Promise<ActionState>,
  fallbackErrorMessage: string,
): Promise<ActionState> {
  return runAdminOperation<ActionState>(action, fallbackErrorMessage, (message) => ({
    message,
    success: false,
  }));
}

type RedirectDestination<T> = string | ((result: T) => string | undefined);

export async function runAdminActionAndRedirect<T extends ActionState>(
  action: () => Promise<T>,
  fallbackErrorMessage: string,
  destination: RedirectDestination<T>,
): Promise<T> {
  const result = await runAdminOperation<T>(action, fallbackErrorMessage, (message) => ({
    message,
    success: false,
  } as T));
  if (!result.success) {
    return result;
  }

  const url = typeof destination === 'function' ? destination(result) : destination;
  if (url) {
    redirect(url);
  }
  return result;
}

type ErrorResultFactory<T> = (message: string) => T;

export async function runAdminOperation<T>(
  action: () => Promise<T>,
  fallbackErrorMessage: string,
  toFailureResult: ErrorResultFactory<T>,
): Promise<T> {
  try {
    await requireAdminSession();
    return await action();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return toFailureResult(
      error instanceof Error ? error.message : fallbackErrorMessage,
    );
  }
}
