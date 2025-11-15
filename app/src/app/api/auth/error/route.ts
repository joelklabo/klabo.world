import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error') ?? 'Configuration';
  const target = new URL('/admin', url.origin);
  if (error) {
    target.searchParams.set('error', error);
  }
  return NextResponse.redirect(target);
}
