import { describe, expect, it, vi } from 'vitest';
import {
  getBitcoinChainSnapshot,
  normalizeBitcoinBlocks,
  normalizeBitcoinBlock,
} from '../src/lib/bitcoin-chain';

const blockA = {
  id: '00000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  height: 948_350,
  timestamp: 1_778_179_143,
  tx_count: 3383,
  size: 1_994_545,
  weight: 3_993_655,
  difficulty: 132_472_011_079_030.52,
  extras: {
    medianFee: 1.2,
    pool: {
      name: 'Foundry USA',
    },
  },
};

const blockB = {
  id: '00000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  height: 948_351,
  timestamp: 1_778_180_108,
  tx_count: 3411,
  size: 1_517_351,
  weight: 3_993_863,
};

describe('Bitcoin chain helpers', () => {
  it('normalizes public block fields and optional mempool extras', () => {
    expect(normalizeBitcoinBlock(blockA)).toMatchObject({
      hash: blockA.id,
      height: 948_350,
      txCount: 3383,
      medianFeeSatVb: 1.2,
      poolName: 'Foundry USA',
    });
  });

  it('sorts recent blocks newest first', () => {
    expect(normalizeBitcoinBlocks([blockA, blockB]).map((block) => block.height)).toEqual([
      948_351,
      948_350,
    ]);
  });

  it('falls back to the secondary source when the primary source fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('upstream unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('upstream unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('upstream unavailable', { status: 503 }))
      .mockResolvedValueOnce(Response.json([blockB, blockA]))
      .mockResolvedValueOnce(
        Response.json({
          count: 45_000,
          vsize: 88_000_000,
          total_fee: 12_000_000,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          fastestFee: 2,
          halfHourFee: 1,
          hourFee: 1,
          economyFee: 1,
          minimumFee: 1,
        }),
      );

    const snapshot = await getBitcoinChainSnapshot(fetchMock as typeof fetch);

    expect(snapshot.source).toBe('Blockstream Esplora');
    expect(snapshot.tip.height).toBe(948_351);
    expect(snapshot.mempool).toMatchObject({
      transactionCount: 45_000,
      vsize: 88_000_000,
      totalFeeSats: 12_000_000,
    });
    expect(snapshot.fees).toMatchObject({
      fastestFeeSatVb: 2,
      halfHourFeeSatVb: 1,
    });
  });
});
