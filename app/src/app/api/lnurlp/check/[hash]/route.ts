import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, getLnbitsAdminKey, buildLnbitsHeaders } from '@/lib/lnbits';

export async function GET(_: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!hash || hash.length < 16) {
    return NextResponse.json({ error: 'invalid_hash' }, { status: 400 });
  }

  const baseUrl = getLnbitsBaseUrl();

  // LNbits v1.4+ requires basic auth AND wallet API key together
  const headers = buildLnbitsHeaders();
  const adminKey = getLnbitsAdminKey();
  if (adminKey) {
    headers['X-Api-Key'] = adminKey;
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
