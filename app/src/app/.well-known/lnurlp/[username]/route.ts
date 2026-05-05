import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';
import { normalizeLnurlUsername } from '@/lib/lnurlp';

function logLnurlEvent(route: string, requestId: string, event: string, details: Record<string, unknown>): void {
  console.info(
    `[lightning.lnurlp] route=${route} request_id=${requestId} event=${event} details=${JSON.stringify(details)}`
  );
}

const LNBITS_PAY_LINK_USERNAME = 'joel';

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const requestedUsername = normalizeLnurlUsername(rawUsername);
  const requestId = randomUUID();
  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  if (requestedUsername !== rawUsername.trim()) {
    logLnurlEvent('well-known', requestId, 'normalize_username', {
      rawUsername,
      requestedUsername,
    });
  }

  logLnurlEvent('well-known', requestId, 'request_start', {
    requestedUsername,
    rawUsername,
    lnbitsBaseUrl: baseUrl,
    source: 'klabo.world',
  });

  // Always fetch from the single "joel" pay link
  const res = await fetch(`${baseUrl}/.well-known/lnurlp/${LNBITS_PAY_LINK_USERNAME}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    logLnurlEvent('well-known', requestId, 'lnbits_meta_failed', {
      status: res.status,
      statusText: res.statusText,
      requestedUsername,
    });
    return NextResponse.json(
      { error: 'lnbits_unreachable' },
      {
        status: res.status,
        headers: {
          'x-lnurlp-request-id': requestId,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  }
  const payload = (await res.json()) as Record<string, unknown>;

  // Preserve the requested username in callback and metadata
  const publicSiteUrl = new URL(getPublicSiteUrl());
  publicSiteUrl.search = '';
  payload.callback = `${publicSiteUrl.toString().replace(/\/$/, '')}/api/lnurlp/${encodeURIComponent(requestedUsername)}/invoice`;

  // Do not rewrite payload.metadata here.
  // LNbits signs the generated BOLT11 invoice with a description_hash of the
  // exact metadata string it serves for the upstream pay link. If this wrapper
  // changes metadata but still asks LNbits to create the invoice, strict LNURL
  // wallets reject the invoice because the served metadata hash no longer
  // matches the invoice description_hash. Rewriting callback is safe; rewriting
  // metadata is not unless this service also owns invoice generation.

  logLnurlEvent('well-known', requestId, 'request_success', {
    requestedUsername,
    callback: payload.callback,
    hasMetadata: Boolean(payload.metadata),
  });

  return NextResponse.json(payload, {
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
