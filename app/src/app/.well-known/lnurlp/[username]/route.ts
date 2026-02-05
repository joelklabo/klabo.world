import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';

export async function GET(_: Request, { params }: { params: { username: string } }) {
  const username = params.username;
  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  const res = await fetch(`${baseUrl}/.well-known/lnurlp/${encodeURIComponent(username)}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'lnbits_unreachable' }, { status: res.status });
  }
  const payload = (await res.json()) as Record<string, unknown>;
  const siteUrl = getPublicSiteUrl();
  payload.callback = `${siteUrl}/api/lnurlp/${encodeURIComponent(username)}/invoice`;
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
