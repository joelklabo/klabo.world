import { requireAdminSession } from '@/lib/adminSession';
import { type ActionState } from '@/lib/formActions';

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
  try {
    await requireAdminSession();
    return await action();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      message: error instanceof Error ? error.message : fallbackErrorMessage,
      success: false,
    };
  }
}
