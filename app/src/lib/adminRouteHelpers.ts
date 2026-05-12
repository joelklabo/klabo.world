import { NextResponse } from 'next/server';
import { isRedirectError } from '@/lib/adminActionHelpers';
import { requireAdminSession } from '@/lib/adminSession';

type SessionResult = Awaited<ReturnType<typeof requireAdminSession>>;
type AdminRoutePayload = Record<string, unknown>;

export class AdminRouteError extends Error {
  status: number;
  payload: AdminRoutePayload;
  headers?: HeadersInit;

  constructor(message: string, status: number, payload: AdminRoutePayload = { error: message }, headers?: HeadersInit) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.headers = headers;
  }
}

function isAdminRouteError(error: unknown): error is AdminRouteError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

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
    if (isAdminRouteError(error)) {
      return NextResponse.json(error.payload, {
        status: error.status,
        headers: error.headers,
      });
    }
    const message = error instanceof Error ? error.message : fallbackErrorMessage;
    return NextResponse.json({ error: message }, { status: fallbackErrorStatus });
  }
}
