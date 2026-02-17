import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';

// All usernames route to the same "joel" pay link in LNbits (wildcard support)
const LNBITS_PAY_LINK_USERNAME = 'joel';

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
    const entries = metadata
      .filter(Array.isArray)
      .filter((item) => item.length >= 2)
      .filter((item) => typeof item[0] === 'string')
      .map((item) => [String(item[0]), String(item[1])]);
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
      normalizedPairs[i] = ['text/identifier', `${requestedUsername}@klabo.world`];
      hasIdentifier = true;
    } else if (pair[0] === 'text/plain') {
      normalizedPairs[i] = ['text/plain', `Payment to ${requestedUsername}@klabo.world`];
      hasPlainText = true;
    }
  }

  if (!hasIdentifier) {
    normalizedPairs.push(['text/identifier', `${requestedUsername}@klabo.world`]);
  }
  if (!hasPlainText) {
    normalizedPairs.push(['text/plain', `Payment to ${requestedUsername}@klabo.world`]);
  }

  return JSON.stringify(normalizedPairs);
}

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const requestedUsername = rawUsername.trim();
  const baseUrl = getLnbitsBaseUrl();
  const headers = buildLnbitsHeaders();
  
  // Always fetch from the single "joel" pay link
  const res = await fetch(`${baseUrl}/.well-known/lnurlp/${LNBITS_PAY_LINK_USERNAME}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'lnbits_unreachable' }, { status: res.status });
  }
  const payload = (await res.json()) as Record<string, unknown>;
  const siteUrl = getPublicSiteUrl();
  
  // Preserve the requested username in callback and metadata
  payload.callback = `${siteUrl}/api/lnurlp/${encodeURIComponent(requestedUsername)}/invoice`;
  
  // Update metadata to show the requested address
  payload.metadata = updateMetadata(payload.metadata, requestedUsername);
  
  return NextResponse.json(payload, {
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
