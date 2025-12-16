import { NextResponse, type NextRequest } from 'next/server';

const LEGACY_HOSTS = new Set(['klabo.blog', 'www.klabo.blog']);
const PRIMARY_HOST = 'klabo.world';

export function middleware(req: NextRequest) {
  const rawHost = req.headers.get('host')?.toLowerCase() ?? '';
  const host = rawHost.split(':')[0];
  if (LEGACY_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = PRIMARY_HOST;
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
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
