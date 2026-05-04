import { describe, expect, it, vi } from 'vitest';

const getLightningNodeStatusMock = vi.fn();

vi.mock('../src/lib/lightning-node-status', () => ({
  getLightningNodeStatus: getLightningNodeStatusMock,
}));

describe('lightning node status API', () => {
  it('returns only public connection status fields', async () => {
    getLightningNodeStatusMock.mockResolvedValueOnce({
      alias: 'klabo.world',
      pubkey: '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68',
      host: 'klabo.world',
      port: 9735,
      uri: '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68@klabo.world:9735',
      reachable: true,
      latencyMs: 42,
      checkedAt: '2026-05-03T18:00:00.000Z',
      source: 'tcp-connect',
    });

    const { GET } = await import('../src/app/api/lightning/node-status/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('max-age=30');
    expect(payload).toMatchObject({
      alias: 'klabo.world',
      host: 'klabo.world',
      port: 9735,
      reachable: true,
      latencyMs: 42,
      source: 'tcp-connect',
    });
    expect(payload).not.toHaveProperty('balance');
    expect(payload).not.toHaveProperty('adminKey');
    expect(payload).not.toHaveProperty('channels');
  });
});
