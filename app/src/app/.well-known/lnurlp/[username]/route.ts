import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';

function logLnurlEvent(route: string, requestId: string, event: string, details: Record<string, unknown>): void {
  console.info(
    `[lightning.lnurlp] route=${route} request_id=${requestId} event=${event} details=${JSON.stringify(details)}`
  );
}

const LNBITS_PAY_LINK_USERNAME = 'joel';

function normalizeLnurlUsername(rawUsername: string) {
  const decoded = (() => {
    try {
      return decodeURIComponent(rawUsername);
    } catch {
      return rawUsername;
    }
  })();
  const [localPart] = decoded.trim().split('@');
  return localPart || decoded.trim();
}

function toMetadataPairs(metadata: unknown): Array<[string, string]> {
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return toMetadataPairs(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(metadata)) {
    const entries: [string, string][] = metadata
      .filter((item): item is [unknown, unknown] => Array.isArray(item) && item.length >= 2)
      .filter((item): item is [string, unknown] => typeof item[0] === 'string')
      .map(([type, value]) => [String(type), String(value)]);
    return entries;
  }

  if (metadata && typeof metadata === 'object') {
    return Object.entries(metadata as Record<string, unknown>).map(([type, value]) => [
      type,
      typeof value === 'string' ? value : '',
    ]);
  }

  return [];
}

function updateMetadata(metadata: unknown, requestedUsername: string): string {
  const metadataPairs = toMetadataPairs(metadata);
  const normalizedPairs = [...metadataPairs];
  let hasIdentifier = false;
  let hasPlainText = false;

  for (let i = 0; i < normalizedPairs.length; i += 1) {
    const pair = normalizedPairs[i];
    if (pair[0] === 'text/identifier') {
      normalizedPairs[i] = ['text/identifier', requestedUsername];
      hasIdentifier = true;
    } else if (pair[0] === 'text/plain') {
      normalizedPairs[i] = ['text/plain', `Payment to ${requestedUsername}`];
      hasPlainText = true;
    }
  }

  if (!hasIdentifier) {
    normalizedPairs.push(['text/identifier', requestedUsername]);
  }
  if (!hasPlainText) {
    normalizedPairs.push(['text/plain', `Payment to ${requestedUsername}`]);
  }

  return JSON.stringify(normalizedPairs);
}

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const requestedUsername = normalizeLnurlUsername(rawUsername);
  const requestId = randomUUID();
  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
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
  const siteUrl = getPublicSiteUrl();
  payload.callback = `${siteUrl}/api/lnurlp/${encodeURIComponent(requestedUsername)}/invoice`;
  
  // Update metadata to show the requested address
  payload.metadata = updateMetadata(payload.metadata, lightningAddress);

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
