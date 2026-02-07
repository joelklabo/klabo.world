import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, getLnbitsAdminKey, buildLnbitsHeaders } from '@/lib/lnbits';

export async function GET(_: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!hash || hash.length < 16) {
    return NextResponse.json({ error: 'invalid_hash' }, { status: 400 });
  }

  const baseUrl = getLnbitsBaseUrl();

  // Try admin key first, fall back to basic auth
  const adminKey = getLnbitsAdminKey();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (adminKey) {
    headers['X-Api-Key'] = adminKey;
  } else {
    const basicHeaders = buildLnbitsHeaders();
    Object.assign(headers, basicHeaders);
  }

  const res = await fetch(`${baseUrl}/api/v1/payments/${encodeURIComponent(hash)}`, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ paid: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const data = (await res.json()) as { paid?: boolean; details?: unknown };
  return NextResponse.json(
    { paid: !!data.paid },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
