import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLightningAddressMetadata, normalizeLnurlUsername } from '../src/lib/lnurlp';

const fetchMock = vi.fn();

vi.mock('@/lib/lnbits', () => ({
  getLnbitsBaseUrl: vi.fn(() => 'https://lnbits.test'),
  buildLnbitsHeaders: vi.fn(() => ({ Authorization: 'Bearer test' })),
  getLnbitsAdminKey: vi.fn(() => 'test-admin-key'),
}));

vi.mock('@/lib/public-env', () => ({
  getPublicSiteUrl: vi.fn(() => 'https://klabo.world'),
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
    expect(normalizeLnurlUsername('Gary%40klabo.world')).toBe('Gary');
  });

  it('decodes and trims whitespace', () => {
    expect(normalizeLnurlUsername('  Hurt%40klabo.world  ')).toBe('Hurt');
  });
});

describe('lnurlp normalization edge cases', () => {
  it('handles encoded and double-encoded input', () => {
    expect(normalizeLnurlUsername('Gary%2540klabo.world')).toBe('Gary');
    expect(normalizeLnurlUsername('s%2540domain.org')).toBe('s');
    expect(normalizeLnurlUsername('Gary%40klabo.world')).toBe('Gary');
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
    const response = await GET(new Request('https://klabo.world/.well-known/lnurlp/Gary%40klabo.world'), {
      params: Promise.resolve({ username: 'Gary%40klabo.world' }),
    });

    expect(response.status).toBe(200);
    const responsePayload = (await response.json()) as { callback: string; metadata: string };
    const callbackUrl = new URL(responsePayload.callback);
    expect(callbackUrl.pathname).toContain('/api/lnurlp/Gary/invoice');
    expect(callbackUrl.search).toBe('');

    expect(responsePayload.metadata).toBe(buildLightningAddressMetadata('Gary@klabo.world'));
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
  });

  it('creates invoices with a description_hash matching the served Lightning Address metadata', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ payment_request: 'lnbc1abcdef', payment_hash: 'f'.repeat(64) }, { status: 200 })
    );

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(new Request('https://klabo.world/api/lnurlp/Gary%40klabo.world/invoice?amount=1000&ns=test'), {
      params: Promise.resolve({ username: 'Gary%40klabo.world' }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    expect(fetchMock.mock.calls[0]![0]).toBe('https://lnbits.test/api/v1/payments');
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body)) as { amount: number; description_hash: string; extra: Record<string, string> };
    const metadata = buildLightningAddressMetadata('Gary@klabo.world');
    expect(body.amount).toBe(1);
    expect(body.description_hash).toBe(createHash('sha256').update(metadata, 'utf8').digest('hex'));
    expect(body.extra.lnurlp_comment).toBe('klabo.world:Gary:test');

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
      new Request('https://klabo.world/api/lnurlp/Gary%40klabo.world/invoice?rid=deadbeef?amount=1000&ns=abc'),
      {
        params: Promise.resolve({ username: 'Gary%40klabo.world' }),
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
        'https://klabo.world/api/lnurlp/Can%40klabo.world/invoice?rid=oops%3Famount%3D1000&ns=Can%40klabo.world',
        {
          method: 'GET',
        }
      ),
      {
        params: Promise.resolve({ username: 'Can%40klabo.world' }),
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { amount: number };
    expect(body.amount).toBe(1);
  });
});
