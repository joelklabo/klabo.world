import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

// All usernames route to the same "joel" pay link in LNbits (wildcard support)
const LNBITS_PAY_LINK_USERNAME = 'joel';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  // Wildcard: all usernames route to the single pay link; username extracted but not used
  await params;
  const url = new URL(request.url);
  const amount = toNumber(url.searchParams.get('amount'));
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  // Always use the single "joel" pay link for invoice generation
  const metaRes = await fetch(`${baseUrl}/.well-known/lnurlp/${LNBITS_PAY_LINK_USERNAME}`, {
    headers,
    cache: 'no-store',
  });
  if (!metaRes.ok) {
    return NextResponse.json({ error: 'lnbits_unreachable' }, { status: metaRes.status });
  }
  const meta = (await metaRes.json()) as { callback?: string };
  if (!meta.callback) {
    return NextResponse.json({ error: 'lnbits_missing_callback' }, { status: 502 });
  }

  const callbackUrl = new URL(meta.callback);
  callbackUrl.searchParams.set('amount', String(amount));
  const invoiceRes = await fetch(callbackUrl.toString(), {
    headers,
    cache: 'no-store',
  });
  if (!invoiceRes.ok) {
    return NextResponse.json({ error: 'lnbits_invoice_failed' }, { status: invoiceRes.status });
  }
  const invoice = await invoiceRes.json();
  return NextResponse.json(invoice, { headers: { 'Cache-Control': 'no-store' } });
}
