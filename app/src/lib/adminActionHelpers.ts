import { type ActionState } from '@/lib/formActions';
import { redirect } from 'next/navigation';
export { isRedirectError } from '@/lib/adminGuards';
import { runWithAdminSession } from '@/lib/adminGuards';

export function getFormSlug(formData: FormData, resourceLabel: string): string {
  const slug = formData.get('slug')?.toString().trim();
  if (!slug) {
    throw new Error(`Missing ${resourceLabel} slug`);
  }
  return slug;
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
  if (result.success) {
    const url = typeof destination === 'function' ? destination(result) : destination;
    if (url) {
      redirect(url);
    }
  }

  return result;
}

type ErrorResultFactory<T> = (message: string) => T;

export async function runAdminOperation<T>(
  action: () => Promise<T>,
  fallbackErrorMessage: string,
  toFailureResult: ErrorResultFactory<T>,
): Promise<T> {
  return runWithAdminSession(
    () => action(),
    (error) =>
      toFailureResult(
        error instanceof Error ? error.message : fallbackErrorMessage,
      ),
  );
}
