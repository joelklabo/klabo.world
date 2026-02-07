import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, getLnbitsAdminKey } from '@/lib/lnbits';

export async function GET(_: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!hash || hash.length < 16) {
    return NextResponse.json({ error: 'invalid_hash' }, { status: 400 });
  }

  const adminKey = getLnbitsAdminKey();
  if (!adminKey) {
    return NextResponse.json({ error: 'lnbits_not_configured' }, { status: 503 });
  }

  const baseUrl = getLnbitsBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/payments/${encodeURIComponent(hash)}`, {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': adminKey,
    },
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
