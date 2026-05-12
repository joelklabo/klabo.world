import { NextResponse, type NextRequest } from 'next/server';
import { LEGACY_HOSTS, PAYMENT_HOSTS, PRIMARY_HOST } from '@/lib/site-config';

const LEGACY_HOST_SET = new Set(LEGACY_HOSTS);
const PAYMENT_HOST_SET = new Set(PAYMENT_HOSTS);

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export function proxy(req: NextRequest) {
  const rawHost = req.headers.get('host')?.toLowerCase() ?? '';
  const host = rawHost.split(':')[0];
  if (LEGACY_HOST_SET.has(host)) {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = PRIMARY_HOST;
    return withSecurityHeaders(NextResponse.redirect(url, 308));
  }

  if (PAYMENT_HOST_SET.has(host) && req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/pay';
    return withSecurityHeaders(NextResponse.rewrite(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
