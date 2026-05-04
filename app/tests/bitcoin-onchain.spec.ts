import { afterEach, describe, expect, it, vi } from 'vitest';

const FIRST_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';
const SECOND_ADDRESS = 'bc1qz0nzrfk9saw2jac2raklutdw74a5lmfqzyh7w5';

describe('bitcoin on-chain address selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('falls back to the configured static address', async () => {
    vi.stubEnv('BITCOIN_ONCHAIN_ADDRESS', FIRST_ADDRESS);

    const { getBitcoinOnchainAddress } = await import('../src/lib/bitcoin-onchain');
    const info = getBitcoinOnchainAddress(new Date('2026-05-04T12:00:00.000Z'));

    expect(info).toMatchObject({
      address: FIRST_ADDRESS,
      uri: `bitcoin:${FIRST_ADDRESS}`,
      source: 'static',
      poolSize: 1,
      rotation: 'none',
    });
  });

  it('rotates through a bounded pool by UTC day', async () => {
    vi.stubEnv('BITCOIN_ONCHAIN_ADDRESS', FIRST_ADDRESS);
    vi.stubEnv('BITCOIN_ONCHAIN_ADDRESS_POOL', `${FIRST_ADDRESS},${SECOND_ADDRESS}`);

    const { getBitcoinOnchainAddress } = await import('../src/lib/bitcoin-onchain');
    const firstDay = getBitcoinOnchainAddress(new Date('1970-01-01T12:00:00.000Z'));
    const secondDay = getBitcoinOnchainAddress(new Date('1970-01-02T12:00:00.000Z'));

    expect(firstDay).toMatchObject({
      address: FIRST_ADDRESS,
      source: 'rotating-pool',
      poolSize: 2,
      rotation: 'daily',
      index: 0,
    });
    expect(secondDay).toMatchObject({
      address: SECOND_ADDRESS,
      source: 'rotating-pool',
      poolSize: 2,
      rotation: 'daily',
      index: 1,
    });
  });
});
