import { NextResponse } from 'next/server';
import { isRedirectError } from '@/lib/adminActionHelpers';
import { requireAdminSession } from '@/lib/adminSession';

type SessionResult = Awaited<ReturnType<typeof requireAdminSession>>;

export async function runAdminRoute(
  handler: (session: SessionResult) => Promise<Response>,
  fallbackErrorStatus = 500,
  fallbackErrorMessage = 'Request failed',
): Promise<Response> {
  try {
    const session = await requireAdminSession();
    return await handler(session);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : fallbackErrorMessage;
    return NextResponse.json({ error: message }, { status: fallbackErrorStatus });
  }
}
