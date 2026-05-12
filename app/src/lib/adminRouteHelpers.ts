import { NextResponse } from 'next/server';
import { runWithAdminSession, type AdminSessionResult } from '@/lib/adminGuards';

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
  handler: (session: AdminSessionResult) => Promise<Response>,
  fallbackErrorStatus = 500,
  fallbackErrorMessage = 'Request failed',
): Promise<Response> {
  return runWithAdminSession(handler, (error) => {
    if (isAdminRouteError(error)) {
      return NextResponse.json(error.payload, {
        status: error.status,
        headers: error.headers,
      });
    }
    const message = error instanceof Error ? error.message : fallbackErrorMessage;
    return NextResponse.json({ error: message }, { status: fallbackErrorStatus });
  });
}
