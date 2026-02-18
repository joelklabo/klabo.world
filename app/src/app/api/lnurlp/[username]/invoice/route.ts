import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { normalizeLnurlUsername } from '@/lib/lnurlp';

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const LNBITS_PAY_LINK_USERNAME = 'joel';

function logLnurlEvent(route: string, requestId: string, event: string, details: Record<string, unknown>): void {
  console.info(
    `[lightning.lnurlp] route=${route} request_id=${requestId} event=${event} details=${JSON.stringify(details)}`
  );
}

function safeStatusText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

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

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  // Wildcard: all usernames route to the single pay link.
  const { username: rawUsername } = await params;
  const normalizedUsername = normalizeLnurlUsername(rawUsername);
  const url = new URL(request.url);
  const amount = toNumber(url.searchParams.get('amount'));
  const namespace = url.searchParams.get('ns') || 'default';
  const requestId = randomUUID();

  logLnurlEvent('invoice', requestId, 'request_start', {
    requestedUsername: normalizedUsername,
    rawUsername,
    namespace,
    amount,
    amountText: url.searchParams.get('amount'),
  });

  if (normalizedUsername !== rawUsername.trim()) {
    logLnurlEvent('invoice', requestId, 'normalize_username', {
      rawUsername,
      normalizedUsername,
    });
  }

  if (!normalizedUsername) {
    logLnurlEvent('invoice', requestId, 'invalid_request', { reason: 'missing_username' });
    return NextResponse.json(
      { error: 'missing_username' },
      {
        status: 400,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  
  if (!amount || amount <= 0) {
    logLnurlEvent('invoice', requestId, 'invalid_request', {
      reason: 'invalid_amount',
      amount: url.searchParams.get('amount') ?? null,
    });
    return NextResponse.json(
      { error: 'invalid_amount' },
      {
        status: 400,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }

  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  // Always use the single "joel" pay link for invoice generation
  const metaRes = await fetch(`${baseUrl}/.well-known/lnurlp/${LNBITS_PAY_LINK_USERNAME}`, {
    headers,
    cache: 'no-store',
  });
  if (!metaRes.ok) {
    logLnurlEvent('invoice', requestId, 'lnbits_meta_failed', {
      status: metaRes.status,
      statusText: safeStatusText(metaRes.statusText),
      requestedUsername: normalizedUsername,
    });
    return NextResponse.json(
      { error: 'lnbits_unreachable' },
      {
        status: metaRes.status,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  const meta = (await metaRes.json()) as { callback?: string };
  if (!meta.callback) {
    logLnurlEvent('invoice', requestId, 'lnbits_missing_callback', { requestedUsername: normalizedUsername });
    return NextResponse.json(
      { error: 'lnbits_missing_callback' },
      {
        status: 502,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  logLnurlEvent('invoice', requestId, 'lnbits_meta_success', {
    requestedUsername: normalizedUsername,
    callbackFromLNBits: meta.callback,
  });

  const callbackUrl = new URL(meta.callback);
  callbackUrl.searchParams.set('amount', String(amount));
  // Add namespace as comment for tip tracking
  callbackUrl.searchParams.set('comment', `klabo.world:${normalizedUsername}:${namespace}`);
  logLnurlEvent('invoice', requestId, 'lnbits_invoice_request', {
    requestedUsername: normalizedUsername,
    callbackUrl: callbackUrl.toString(),
  });
  
  const invoiceRes = await fetch(callbackUrl.toString(), {
    headers,
    cache: 'no-store',
  });
  if (!invoiceRes.ok) {
    logLnurlEvent('invoice', requestId, 'lnbits_invoice_failed', {
      status: invoiceRes.status,
      statusText: safeStatusText(invoiceRes.statusText),
      requestUrl: callbackUrl.toString(),
    });
    return NextResponse.json(
      { error: 'lnbits_invoice_failed' },
      {
        status: invoiceRes.status,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  const invoice = (await invoiceRes.json()) as Record<string, unknown>;
  const paymentRequest = invoice.pr || invoice.payment_request;
  if (typeof paymentRequest !== 'string' || paymentRequest.length === 0) {
    const responseKeys = invoice && typeof invoice === 'object' ? Object.keys(invoice).slice(0, 8) : [];
    logLnurlEvent('invoice', requestId, 'lnbits_invoice_invalid', {
      requestedUsername: normalizedUsername,
      responseKeys,
    });
    return NextResponse.json(
      { error: 'lnbits_invalid_invoice' },
      {
        status: 502,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  logLnurlEvent('invoice', requestId, 'lnbits_invoice_success', {
    requestedUsername: normalizedUsername,
    hasPaymentRequest: true,
    route: callbackUrl.pathname,
    responseKeys: Object.keys(invoice).slice(0, 8),
    status: invoiceRes.status,
  });

  // Extract payment_hash from the bolt11 so clients can poll for payment status
  const bolt11 = paymentRequest as string;
  if (bolt11) {
    const paymentHash = extractPaymentHash(bolt11);
    if (paymentHash) {
      invoice.payment_hash = paymentHash;
    }
  }

  return NextResponse.json(invoice, {
    headers: {
      'x-lnurlp-request-id': requestId,
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
