import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLightningAddressMetadata, normalizeLnurlUsername } from '../src/lib/lnurlp';
import { LIGHTNING_NAMESPACE_PREFIX, SITE_CANONICAL_URL } from '@/lib/site-config';

const fetchMock = vi.fn();
const siteDomain = new URL(SITE_CANONICAL_URL).hostname;

function atDomain(local: string): string {
  return `${local}%40${siteDomain}`;
}

function lightningAddress(local: string): string {
  return `${local}@${siteDomain}`;
}

function lightningAddressComment(username: string, namespace: string): string {
  return `${LIGHTNING_NAMESPACE_PREFIX}${username}:${namespace}`;
}

function siteUrl(path: string): string {
  return new URL(path, SITE_CANONICAL_URL).toString();
}

function doubleEncodedAtDomain(local: string): string {
  return `${local}%2540${siteDomain}`;
}

vi.mock('@/lib/lnbits', () => ({
  getLnbitsBaseUrl: vi.fn(() => 'https://lnbits.test'),
  buildLnbitsHeaders: vi.fn(() => ({ Authorization: 'Bearer test' })),
  getLnbitsAdminKey: vi.fn(() => 'test-admin-key'),
}));

vi.mock('@/lib/public-env', () => ({
  getPublicSiteUrl: vi.fn(() => SITE_CANONICAL_URL),
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('lnurlp normalization', () => {
  it('preserves local-part casing (wallets may validate exact identifier)', () => {
    expect(normalizeLnurlUsername('Gary')).toBe('Gary');
  });

  it('drops domain suffix from raw lightning addresses', () => {
    expect(normalizeLnurlUsername(atDomain('Gary'))).toBe('Gary');
  });

  it('decodes and trims whitespace', () => {
    expect(normalizeLnurlUsername(`  ${atDomain('Hurt')}  `)).toBe('Hurt');
  });
});

describe('lnurlp normalization edge cases', () => {
  it('handles encoded and double-encoded input', () => {
    expect(normalizeLnurlUsername(doubleEncodedAtDomain('Gary'))).toBe('Gary');
    expect(normalizeLnurlUsername('s%2540domain.org')).toBe('s');
    expect(normalizeLnurlUsername(atDomain('Gary'))).toBe('Gary');
  });
});

describe('lnurlp route handlers', () => {
  it('keeps mixed-case usernames in well-known callback and metadata', async () => {
    const metadata =
      '[["description","legacy"],["text/plain","Payment to joel"],["text/identifier","joel@lnbits.test"]]';
    const payload = {
      tag: 'payRequest',
      callback: 'https://lnbits.test/.well-known/lnurlp/joel',
      metadata,
      minSendable: 1000,
      maxSendable: 1_000_000,
    };
    fetchMock.mockResolvedValueOnce(Response.json(payload, { status: 200 }));

    const { GET } = await import('@/app/.well-known/lnurlp/[username]/route');
    const response = await GET(new Request(siteUrl(`/.well-known/lnurlp/${atDomain('Gary')}`)), {
      params: Promise.resolve({ username: atDomain('Gary') }),
    });

    expect(response.status).toBe(200);
    const responsePayload = (await response.json()) as { callback: string; metadata: string };
    const callbackUrl = new URL(responsePayload.callback);
    expect(callbackUrl.pathname).toContain('/api/lnurlp/Gary/invoice');
    expect(callbackUrl.search).toBe('');

    expect(responsePayload.metadata).toBe(buildLightningAddressMetadata(lightningAddress('Gary')));
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
  });

  it('returns a structured 502 when LNBits metadata fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('upstream reset'));

    const { GET } = await import('@/app/.well-known/lnurlp/[username]/route');
    const response = await GET(new Request(siteUrl('/.well-known/lnurlp/test')), {
      params: Promise.resolve({ username: 'test' }),
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const errorPayload = (await response.json()) as { error: string; requestId: string };
    expect(errorPayload.error).toBe('lnbits_metadata_fetch_failed');
    expect(errorPayload.requestId).toBeTruthy();
  });

  it('returns a structured 502 when LNBits metadata is not valid JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('service temporarily returned html', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    const { GET } = await import('@/app/.well-known/lnurlp/[username]/route');
    const response = await GET(new Request(siteUrl('/.well-known/lnurlp/test')), {
      params: Promise.resolve({ username: 'test' }),
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();

    const errorPayload = (await response.json()) as { error: string; upstreamStatus: number };
    expect(errorPayload.error).toBe('lnbits_metadata_parse_failed');
    expect(errorPayload.upstreamStatus).toBe(200);
  });

  it('creates invoices with a description_hash matching the served Lightning Address metadata', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ payment_request: 'lnbc1abcdef', payment_hash: 'f'.repeat(64) }, { status: 200 })
    );

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(
      new Request(siteUrl(`/api/lnurlp/${atDomain('Gary')}/invoice?amount=1000&ns=test`)),
      {
        params: Promise.resolve({ username: atDomain('Gary') }),
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    expect(fetchMock.mock.calls[0]![0]).toBe('https://lnbits.test/api/v1/payments');
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body)) as { amount: number; description_hash: string; extra: Record<string, string> };
    const metadata = buildLightningAddressMetadata(lightningAddress('Gary'));
    expect(body.amount).toBe(1);
    expect(body.description_hash).toBe(createHash('sha256').update(metadata, 'utf8').digest('hex'));
    expect(body.extra.lnurlp_comment).toBe(lightningAddressComment('Gary', 'test'));

    const invoice = (await response.json()) as { pr: string; payment_hash: string };
    expect(invoice.pr).toBe('lnbc1abcdef');
    expect(invoice.payment_hash).toBe('f'.repeat(64));
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
  });

  it('accepts malformed invoice requests where amount is appended after an existing query separator', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ payment_request: 'lnbc1abcdef', payment_hash: 'f'.repeat(64) }, { status: 200 })
    );

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(
      new Request(
        siteUrl(`/api/lnurlp/${atDomain('Gary')}/invoice?rid=deadbeef?amount=1000&ns=abc`)
      ),
      {
        params: Promise.resolve({ username: atDomain('Gary') }),
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { amount: number };
    expect(body.amount).toBe(1);
  });

  it('accepts invoice requests where amount is percent-encoded in legacy query string', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ payment_request: 'lnbc1abcdef', payment_hash: 'f'.repeat(64) }, { status: 200 })
    );

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(
      new Request(
        siteUrl(`/api/lnurlp/${atDomain('Can')}/invoice?rid=oops%3Famount%3D1000&ns=${atDomain('Can')}`),
        {
          method: 'GET',
        }
      ),
      {
        params: Promise.resolve({ username: atDomain('Can') }),
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { amount: number };
    expect(body.amount).toBe(1);
  });
});
