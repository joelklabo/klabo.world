import { z } from 'zod';

const BITCOIN_SOURCES = [
  {
    name: 'mempool.space',
    apiBase: 'https://mempool.space/api',
  },
  {
    name: 'Blockstream Esplora',
    apiBase: 'https://blockstream.info/api',
  },
] as const;

const BLOCK_REQUEST_TIMEOUT_MS = 5000;

const rawBlockSchema = z
  .object({
    id: z.string().min(1),
    height: z.number().int().nonnegative(),
    timestamp: z.number().int().positive(),
    tx_count: z.number().int().nonnegative(),
    size: z.number().int().nonnegative().optional(),
    weight: z.number().int().nonnegative().optional(),
    difficulty: z.number().positive().optional(),
    extras: z
      .object({
        medianFee: z.number().nonnegative().optional(),
        pool: z
          .object({
            name: z.string().min(1).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const rawMempoolSchema = z
  .object({
    count: z.number().int().nonnegative(),
    vsize: z.number().int().nonnegative(),
    total_fee: z.number().nonnegative(),
  })
  .passthrough();

export type BitcoinSourceName = (typeof BITCOIN_SOURCES)[number]['name'];

export type BitcoinBlockSummary = {
  hash: string;
  height: number;
  timestamp: number;
  txCount: number;
  sizeBytes: number | null;
  weight: number | null;
  difficulty: number | null;
  medianFeeSatVb: number | null;
  poolName: string | null;
};

export type BitcoinMempoolSummary = {
  transactionCount: number;
  vsize: number;
  totalFeeSats: number;
};

export type BitcoinChainSnapshot = {
  network: 'mainnet';
  source: BitcoinSourceName;
  checkedAt: string;
  tip: BitcoinBlockSummary;
  recentBlocks: BitcoinBlockSummary[];
  mempool: BitcoinMempoolSummary | null;
};

type FetchLike = typeof fetch;

function timeoutSignal(timeoutMs: number) {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function fetchJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
  const response = await fetchImpl(url, {
    cache: 'no-store',
    signal: timeoutSignal(BLOCK_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Bitcoin data request failed: ${response.status}`);
  }

  return response.json();
}

export function normalizeBitcoinBlock(input: unknown): BitcoinBlockSummary {
  const block = rawBlockSchema.parse(input);

  return {
    hash: block.id,
    height: block.height,
    timestamp: block.timestamp,
    txCount: block.tx_count,
    sizeBytes: block.size ?? null,
    weight: block.weight ?? null,
    difficulty: block.difficulty ?? null,
    medianFeeSatVb: block.extras?.medianFee ?? null,
    poolName: block.extras?.pool?.name ?? null,
  };
}

export function normalizeBitcoinBlocks(input: unknown): BitcoinBlockSummary[] {
  const blocks = z.array(z.unknown()).parse(input);

  return blocks
    .map((block) => normalizeBitcoinBlock(block))
    .sort((a, b) => b.height - a.height);
}

function normalizeMempool(input: unknown): BitcoinMempoolSummary {
  const mempool = rawMempoolSchema.parse(input);

  return {
    transactionCount: mempool.count,
    vsize: mempool.vsize,
    totalFeeSats: mempool.total_fee,
  };
}

async function getSnapshotFromSource(
  fetchImpl: FetchLike,
  source: (typeof BITCOIN_SOURCES)[number],
): Promise<BitcoinChainSnapshot> {
  const [blocksJson, mempoolResult] = await Promise.all([
    fetchJson(fetchImpl, `${source.apiBase}/blocks`),
    fetchJson(fetchImpl, `${source.apiBase}/mempool`).then(
      (mempool) => ({ ok: true as const, mempool }),
      () => ({ ok: false as const }),
    ),
  ]);

  const recentBlocks = normalizeBitcoinBlocks(blocksJson);
  const tip = recentBlocks[0];

  if (!tip) {
    throw new Error(`Bitcoin data source ${source.name} returned no blocks`);
  }

  return {
    network: 'mainnet',
    source: source.name,
    checkedAt: new Date().toISOString(),
    tip,
    recentBlocks,
    mempool: mempoolResult.ok ? normalizeMempool(mempoolResult.mempool) : null,
  };
}

export async function getBitcoinChainSnapshot(
  fetchImpl: FetchLike = fetch,
): Promise<BitcoinChainSnapshot> {
  const failures: Error[] = [];

  for (const source of BITCOIN_SOURCES) {
    try {
      return await getSnapshotFromSource(fetchImpl, source);
    } catch (error) {
      failures.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  throw new AggregateError(failures, 'All Bitcoin data sources failed');
}
