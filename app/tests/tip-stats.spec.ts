import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLnbitsBaseUrl: vi.fn(),
  buildLnbitsHeaders: vi.fn(),
  getLnbitsAdminKey: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/lnbits', () => ({
  getLnbitsBaseUrl: mocks.getLnbitsBaseUrl,
  buildLnbitsHeaders: mocks.buildLnbitsHeaders,
  getLnbitsAdminKey: mocks.getLnbitsAdminKey,
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.getLnbitsBaseUrl.mockReset();
  mocks.buildLnbitsHeaders.mockReset();
  mocks.getLnbitsAdminKey.mockReset();
  mocks.fetch.mockReset();
  mocks.buildLnbitsHeaders.mockReturnValue({ Accept: 'application/json' });
});

describe('tip stats API', () => {
  it('returns empty public stats when LNBits is not configured', async () => {
    mocks.getLnbitsBaseUrl.mockImplementation(() => {
      throw new Error('LNBITS_BASE_URL is not configured');
    });
    mocks.getLnbitsAdminKey.mockReturnValue(null);

    const { GET } = await import('@/app/api/tip-stats/route');
    const response = await GET(new Request('https://klabo.world/api/tip-stats?ns=home'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      namespace: 'home',
      count: 0,
      totalSats: 0,
      largestTip: 0,
    });
  });

  it('counts settled tips for the username-scoped namespace comment format', async () => {
    mocks.getLnbitsBaseUrl.mockReturnValue('https://lnbits.test');
    mocks.getLnbitsAdminKey.mockReturnValue('admin-key');
    mocks.fetch.mockResolvedValueOnce(
      Response.json([
        { amount: 21 * 1000, pending: false, extra: { comment: 'klabo.world:joel:home' } },
        { amount: 100 * 1000, pending: null, extra: { comment: 'klabo.world:home' } },
        { amount: 999 * 1000, pending: false, extra: { comment: 'klabo.world:joel:post:other' } },
        { amount: 5 * 1000, pending: true, extra: { comment: 'klabo.world:joel:home' } },
        { amount: -1 * 1000, pending: false, extra: { comment: 'klabo.world:joel:home' } },
      ])
    );

    const { GET } = await import('@/app/api/tip-stats/route');
    const response = await GET(new Request('https://klabo.world/api/tip-stats?ns=home'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      namespace: 'home',
      count: 2,
      totalSats: 121,
      largestTip: 100,
    });
    expect(mocks.fetch).toHaveBeenCalledWith('https://lnbits.test/api/v1/payments?limit=1000', {
      headers: {
        Accept: 'application/json',
        'X-Api-Key': 'admin-key',
      },
      cache: 'no-store',
    });
  });
});
