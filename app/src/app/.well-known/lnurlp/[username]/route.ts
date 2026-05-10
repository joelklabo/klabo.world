import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';
import { buildLightningAddressMetadata, normalizeLnurlUsername } from '@/lib/lnurlp';

function logLnurlEvent(route: string, requestId: string, event: string, details: Record<string, unknown>): void {
  console.info(
    `[lightning.lnurlp] route=${route} request_id=${requestId} event=${event} details=${JSON.stringify(details)}`
  );
}

const LNBITS_PAY_LINK_USERNAME = 'joel';

function lnurlpHeaders(requestId: string): HeadersInit {
  return {
    'x-lnurlp-request-id': requestId,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

function safeStatusText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function errorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return {
    message: String(error),
  };
}

function upstreamBodySnippet(body: string): string {
  return body.slice(0, 500);
}

function jsonError(error: string, status: number, requestId: string, upstreamStatus?: number) {
  return NextResponse.json(
    {
      error,
      requestId,
      ...(typeof upstreamStatus === 'number' ? { upstreamStatus } : {}),
    },
    {
      status,
      headers: lnurlpHeaders(requestId),
    }
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const requestedUsername = normalizeLnurlUsername(rawUsername);
  const requestId = randomUUID();
  const lightningAddress = `${requestedUsername}@${new URL(getPublicSiteUrl()).host}`;
  if (requestedUsername !== rawUsername.trim()) {
    logLnurlEvent('well-known', requestId, 'normalize_username', {
      rawUsername,
      requestedUsername,
    });
  }

  logLnurlEvent('well-known', requestId, 'request_start', {
    requestedUsername,
    rawUsername,
    source: 'klabo.world',
  });

  let baseUrl: string;
  let headers: Record<string, string>;
  try {
    baseUrl = getLnbitsBaseUrl();
    headers = buildLnbitsHeaders();
  } catch (error) {
    logLnurlEvent('well-known', requestId, 'invalid_config', {
      requestedUsername,
      ...errorDetails(error),
    });
    return jsonError('lnbits_config_invalid', 500, requestId);
  }

  // Always fetch from the single "joel" pay link
  const upstreamUrl = `${baseUrl}/.well-known/lnurlp/${LNBITS_PAY_LINK_USERNAME}`;
  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    logLnurlEvent('well-known', requestId, 'lnbits_meta_fetch_error', {
      requestedUsername,
      upstreamUrl,
      ...errorDetails(error),
    });
    return jsonError('lnbits_metadata_fetch_failed', 502, requestId);
  }

  if (!res.ok) {
    let body = '';
    try {
      body = await res.text();
    } catch (error) {
      logLnurlEvent('well-known', requestId, 'lnbits_meta_error_body_failed', {
        status: res.status,
        statusText: safeStatusText(res.statusText),
        requestedUsername,
        ...errorDetails(error),
      });
    }
    logLnurlEvent('well-known', requestId, 'lnbits_meta_failed', {
      status: res.status,
      statusText: safeStatusText(res.statusText),
      requestedUsername,
      upstreamUrl,
      body: upstreamBodySnippet(body),
    });
    return jsonError('lnbits_metadata_unavailable', 502, requestId, res.status);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = (await res.json()) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      logLnurlEvent('well-known', requestId, 'lnbits_meta_invalid', {
        requestedUsername,
        upstreamUrl,
        parsedType: Array.isArray(parsed) ? 'array' : typeof parsed,
      });
      return jsonError('lnbits_metadata_invalid', 502, requestId, res.status);
    }
    payload = parsed as Record<string, unknown>;
  } catch (error) {
    logLnurlEvent('well-known', requestId, 'lnbits_meta_json_error', {
      requestedUsername,
      upstreamUrl,
      ...errorDetails(error),
    });
    return jsonError('lnbits_metadata_parse_failed', 502, requestId, res.status);
  }

  // Preserve the requested username in callback and metadata
  const publicSiteUrl = new URL(getPublicSiteUrl());
  publicSiteUrl.search = '';
  payload.callback = `${publicSiteUrl.toString().replace(/\/$/, '')}/api/lnurlp/${encodeURIComponent(requestedUsername)}/invoice`;

  // This service owns the LNURL metadata bytes. The invoice route must create
  // BOLT11 invoices with description_hash = SHA256(payload.metadata) exactly.
  payload.metadata = buildLightningAddressMetadata(lightningAddress);

  logLnurlEvent('well-known', requestId, 'request_success', {
    requestedUsername,
    callback: payload.callback,
    hasMetadata: Boolean(payload.metadata),
  });

  return NextResponse.json(payload, {
    headers: lnurlpHeaders(requestId),
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
