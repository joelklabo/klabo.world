import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/** Extract payment hash from a bolt11 invoice string (no external deps). */
function extractPaymentHash(bolt11: string): string | null {
  try {
    const invoice = bolt11.toLowerCase();
    const sepIdx = invoice.lastIndexOf('1');
    if (sepIdx === -1) return null;
    const dataStr = invoice.slice(sepIdx + 1, -6); // strip checksum
    const data5 = [...dataStr].map((ch) => BECH32_CHARSET.indexOf(ch));
    if (data5.some((v) => v < 0)) return null;

    let pos = 7; // skip timestamp (7 × 5-bit groups)
    while (pos + 3 <= data5.length) {
      const type = data5[pos];
      const dataLen = data5[pos + 1] * 32 + data5[pos + 2];
      pos += 3;
      if (type === 1) {
        // payment hash — convert 5-bit groups to bytes
        const groups = data5.slice(pos, pos + dataLen);
        let acc = 0;
        let bits = 0;
        const bytes: number[] = [];
        for (const val of groups) {
          acc = (acc << 5) | val;
          bits += 5;
          while (bits >= 8) {
            bits -= 8;
            bytes.push((acc >> bits) & 0xFF);
          }
        }
        return Buffer.from(bytes.slice(0, 32)).toString('hex');
      }
      pos += dataLen;
    }
    return null;
  } catch {
    return null;
  }
}

// All usernames route to the same "joel" pay link in LNbits (wildcard support)
const LNBITS_PAY_LINK_USERNAME = 'joel';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  // Wildcard: all usernames route to the single pay link.
  const { username: rawUsername } = await params;
  const normalizedUsername = rawUsername.trim();
  const canonicalUsername = normalizedUsername.toLowerCase();
  const url = new URL(request.url);
  const amount = toNumber(url.searchParams.get('amount'));
  const namespace = url.searchParams.get('ns') || 'default';

  if (!normalizedUsername) {
    return NextResponse.json({ error: 'missing_username' }, { status: 400 });
  }
  
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
  // Add namespace as comment for tip tracking
  callbackUrl.searchParams.set('comment', `klabo.world:${canonicalUsername}:${namespace}`);
  
  const invoiceRes = await fetch(callbackUrl.toString(), {
    headers,
    cache: 'no-store',
  });
  if (!invoiceRes.ok) {
    return NextResponse.json({ error: 'lnbits_invoice_failed' }, { status: invoiceRes.status });
  }
  const invoice = (await invoiceRes.json()) as Record<string, unknown>;

  // Extract payment_hash from the bolt11 so clients can poll for payment status
  const bolt11 = (invoice.pr || invoice.payment_request) as string | undefined;
  if (bolt11) {
    const paymentHash = extractPaymentHash(bolt11);
    if (paymentHash) {
      invoice.payment_hash = paymentHash;
    }
  }

  return NextResponse.json(invoice, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}
