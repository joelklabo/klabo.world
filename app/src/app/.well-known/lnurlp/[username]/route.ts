import { NextResponse } from 'next/server';
import { getLnbitsBaseUrl, buildLnbitsHeaders } from '@/lib/lnbits';
import { getPublicSiteUrl } from '@/lib/public-env';

// All usernames route to the same "joel" pay link in LNbits (wildcard support)
const LNBITS_PAY_LINK_USERNAME = 'joel';

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: requestedUsername } = await params;
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
  const metadata = JSON.parse(payload.metadata as string || '[]') as string[][];
  const identifierIdx = metadata.findIndex(([type]) => type === 'text/identifier');
  if (identifierIdx !== -1) {
    metadata[identifierIdx] = ['text/identifier', `${requestedUsername}@klabo.world`];
  }
  const plainIdx = metadata.findIndex(([type]) => type === 'text/plain');
  if (plainIdx !== -1) {
    metadata[plainIdx] = ['text/plain', `Payment to ${requestedUsername}@klabo.world`];
  }
  payload.metadata = JSON.stringify(metadata);
  
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
