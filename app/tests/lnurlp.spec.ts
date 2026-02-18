import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeLnurlUsername, updateMetadataWithLightningAddress } from '../src/lib/lnurlp';

const fetchMock = vi.fn();

vi.mock('@/lib/lnbits', () => ({
  getLnbitsBaseUrl: vi.fn(() => 'https://lnbits.test'),
  buildLnbitsHeaders: vi.fn(() => ({ Authorization: 'Bearer test' })),
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

describe('lnurlp metadata update', () => {
  it('replaces existing metadata identifier and plain text entries', () => {
    const raw = '[["text/plain","Payment to joel@klabo.world"],["text/identifier","joel@klabo.world"]]';
    const next = updateMetadataWithLightningAddress(raw, 'Gary@klabo.world');
    const parsed = JSON.parse(next) as [string, string][];

    expect(parsed).toContainEqual(['text/identifier', 'Gary@klabo.world']);
    expect(parsed).toContainEqual(['text/plain', 'Payment to Gary@klabo.world']);
  });

  it('adds missing metadata fields for incomplete payloads', () => {
    const next = updateMetadataWithLightningAddress('[["description","old format"]]', 'Gary@klabo.world');
    const parsed = JSON.parse(next) as [string, string][];

    expect(parsed).toContainEqual(['text/plain', 'Payment to Gary@klabo.world']);
    expect(parsed).toContainEqual(['text/identifier', 'Gary@klabo.world']);
    expect(parsed).toContainEqual(['description', 'old format']);
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
    const payload = {
      tag: 'payRequest',
      callback: 'https://lnbits.test/.well-known/lnurlp/joel',
      metadata:
        '[["description","legacy"],["text/plain","Payment to joel@klabo.world"],["text/identifier","joel@klabo.world"]]',
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

    const parsedMetadata = JSON.parse(responsePayload.metadata) as Array<[string, string]>;
    const identifier = parsedMetadata.find((entry) => entry[0] === 'text/identifier')?.[1];
    const plainText = parsedMetadata.find((entry) => entry[0] === 'text/plain')?.[1];
    expect(identifier).toBe('Gary@klabo.world');
    expect(plainText).toBe('Payment to Gary@klabo.world');
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
  });

  it('forwards normalized identifier into LNBits comment and still returns invoice details', async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            callback: 'https://lnbits.test/api/v1/lnurlp/joel/callback',
            tag: 'payRequest',
          },
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(Response.json({ pr: 'lnbc1abcdef', routes: [], disposable: false }, { status: 200 }));

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(new Request('https://klabo.world/api/lnurlp/Gary%40klabo.world/invoice?amount=1000&ns=test'), {
      params: Promise.resolve({ username: 'Gary%40klabo.world' }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);

    const secondCall = new URL(fetchMock.mock.calls[1]![0] as string);
    expect(secondCall.searchParams.get('comment')).toBe('klabo.world:Gary:test');

    const invoice = (await response.json()) as { pr: string };
    expect(invoice.pr).toBe('lnbc1abcdef');
    expect(response.headers.get('x-lnurlp-request-id')).toBeTruthy();
  });

  it('accepts malformed invoice requests where amount is appended after an existing query separator', async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            callback: 'https://lnbits.test/api/v1/lnurlp/joel/callback',
            tag: 'payRequest',
          },
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(Response.json({ pr: 'lnbc1abcdef', routes: [], disposable: false }, { status: 200 }));

    const { GET } = await import('@/app/api/lnurlp/[username]/invoice/route');
    const response = await GET(
      new Request('https://klabo.world/api/lnurlp/Gary%40klabo.world/invoice?rid=deadbeef?amount=1000&ns=abc'),
      {
        params: Promise.resolve({ username: 'Gary%40klabo.world' }),
      }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);

    const secondCall = new URL(fetchMock.mock.calls[1]![0] as string);
    expect(secondCall.searchParams.get('amount')).toBe('1000');
  });

  it('accepts invoice requests where amount is percent-encoded in legacy query string', async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            callback: 'https://lnbits.test/api/v1/lnurlp/joel/callback',
            tag: 'payRequest',
          },
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(Response.json({ pr: 'lnbc1abcdef', routes: [], disposable: false }, { status: 200 }));

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

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);

    const secondCall = new URL(fetchMock.mock.calls[1]![0] as string);
    expect(secondCall.searchParams.get('amount')).toBe('1000');
  });
});
