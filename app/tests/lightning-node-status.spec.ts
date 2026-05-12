import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LIGHTNING_NODE_ALIAS,
  DEFAULT_LIGHTNING_NODE_HOST,
  DEFAULT_LIGHTNING_NODE_PORT,
  DEFAULT_LIGHTNING_NODE_PUBKEY,
} from '@/lib/site-config';
import { buildLightningNodeUri } from '@/lib/lightning-node-uri';

const getLightningNodeStatusMock = vi.fn();

vi.mock('../src/lib/lightning-node-status', () => ({
  getLightningNodeStatus: getLightningNodeStatusMock,
}));

describe('lightning node status API', () => {
  it('returns only public connection status fields', async () => {
    getLightningNodeStatusMock.mockResolvedValueOnce({
      alias: DEFAULT_LIGHTNING_NODE_ALIAS,
      pubkey: DEFAULT_LIGHTNING_NODE_PUBKEY,
      host: DEFAULT_LIGHTNING_NODE_HOST,
      port: DEFAULT_LIGHTNING_NODE_PORT,
      uri: buildLightningNodeUri({
        pubkey: DEFAULT_LIGHTNING_NODE_PUBKEY,
        host: DEFAULT_LIGHTNING_NODE_HOST,
        port: DEFAULT_LIGHTNING_NODE_PORT,
      }),
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
      alias: DEFAULT_LIGHTNING_NODE_ALIAS,
      host: DEFAULT_LIGHTNING_NODE_HOST,
      port: DEFAULT_LIGHTNING_NODE_PORT,
      reachable: true,
      latencyMs: 42,
      source: 'tcp-connect',
    });
    expect(payload).not.toHaveProperty('balance');
    expect(payload).not.toHaveProperty('adminKey');
    expect(payload).not.toHaveProperty('channels');
  });
});
