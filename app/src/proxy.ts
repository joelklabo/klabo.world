import { NextResponse, type NextRequest } from 'next/server';

const LEGACY_HOSTS = new Set(['klabo.blog', 'www.klabo.blog']);
const PRIMARY_HOST = 'klabo.world';

export function proxy(req: NextRequest) {
  const rawHost = req.headers.get('host')?.toLowerCase() ?? '';
  const host = rawHost.split(':')[0];
  if (!LEGACY_HOSTS.has(host)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.protocol = 'https:';
  url.hostname = PRIMARY_HOST;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: '/:path*',
};
