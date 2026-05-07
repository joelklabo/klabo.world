'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bitcoin,
  Blocks,
  Clock3,
  ExternalLink,
  Radio,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MEMPOOL_WEBSOCKET_URL = 'wss://mempool.space/api/v1/ws';
const CHAIN_TIP_ENDPOINT = '/api/bitcoin/chain-tip';
const TARGET_BLOCK_INTERVAL_SECONDS = 600;

type BitcoinBlockSummary = {
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

type BitcoinMempoolSummary = {
  transactionCount: number;
  vsize: number;
  totalFeeSats: number;
};

type BitcoinChainSnapshot = {
  network: 'mainnet';
  source: string;
  checkedAt: string;
  tip: BitcoinBlockSummary;
  recentBlocks: BitcoinBlockSummary[];
  mempool: BitcoinMempoolSummary | null;
};

type SocketState = 'connecting' | 'open' | 'fallback' | 'error';

const numberFormatter = new Intl.NumberFormat('en-US');
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const satsFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeSocketBlock(input: unknown): BitcoinBlockSummary | null {
  if (!isRecord(input)) return null;

  const hash = readString(input.id);
  const height = readNumber(input.height);
  const timestamp = readNumber(input.timestamp);
  const txCount = readNumber(input.tx_count);

  if (!hash || height === null || timestamp === null || txCount === null) {
    return null;
  }

  const extras = isRecord(input.extras) ? input.extras : null;
  const pool = extras && isRecord(extras.pool) ? extras.pool : null;

  return {
    hash,
    height,
    timestamp,
    txCount,
    sizeBytes: readNumber(input.size),
    weight: readNumber(input.weight),
    difficulty: readNumber(input.difficulty),
    medianFeeSatVb: extras ? readNumber(extras.medianFee) : null,
    poolName: pool ? readString(pool.name) : null,
  };
}

function normalizeSocketMempool(input: unknown): BitcoinMempoolSummary | null {
  if (!isRecord(input)) return null;

  const transactionCount = readNumber(input.count);
  const vsize = readNumber(input.vsize);
  const totalFeeSats = readNumber(input.total_fee);

  if (transactionCount === null || vsize === null || totalFeeSats === null) {
    return null;
  }

  return { transactionCount, vsize, totalFeeSats };
}

function sortBlocks(blocks: BitcoinBlockSummary[]) {
  return [...blocks].sort((a, b) => b.height - a.height);
}

function formatElapsed(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const remainingSeconds = clamped % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  }

  return `${remainingSeconds}s`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatBlockTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function mergeBlocks(
  existing: BitcoinBlockSummary[],
  incoming: BitcoinBlockSummary[],
): BitcoinBlockSummary[] {
  const blocksByHeight = new Map<number, BitcoinBlockSummary>();

  for (const block of [...existing, ...incoming]) {
    blocksByHeight.set(block.height, block);
  }

  return sortBlocks([...blocksByHeight.values()]).slice(0, 8);
}

type LiveBitcoinSectionProps = {
  className?: string;
};

export function LiveBitcoinSection({ className }: LiveBitcoinSectionProps) {
  const [snapshot, setSnapshot] = useState<BitcoinChainSnapshot | null>(null);
  const [socketState, setSocketState] = useState<SocketState>('connecting');
  const [now, setNow] = useState(() => Date.now());
  const [lastReceivedAt, setLastReceivedAt] = useState<number | null>(null);
  const [newBlockHeight, setNewBlockHeight] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('Bitcoin chain data loading');
  const latestHeightRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySnapshot = useCallback((nextSnapshot: BitcoinChainSnapshot) => {
    setLastReceivedAt(Date.now());
    setSnapshot((current) => {
      const previousHeight = latestHeightRef.current;
      const nextHeight = nextSnapshot.tip.height;
      latestHeightRef.current = nextHeight;

      if (previousHeight !== null && nextHeight > previousHeight) {
        setNewBlockHeight(nextHeight);
        setAnnouncement(`New Bitcoin block ${numberFormatter.format(nextHeight)} found`);
        if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = setTimeout(() => setNewBlockHeight(null), 12_000);
      } else if (!current) {
        setAnnouncement(`Bitcoin block ${numberFormatter.format(nextHeight)} is the current tip`);
      }

      return nextSnapshot;
    });
  }, []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch(CHAIN_TIP_ENDPOINT, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`chain tip request failed: ${response.status}`);
      }
      const nextSnapshot = (await response.json()) as BitcoinChainSnapshot;
      applySnapshot(nextSnapshot);
      setSocketState((current) => (current === 'open' ? current : 'fallback'));
    } catch {
      setSocketState((current) => (current === 'open' ? current : 'error'));
    }
  }, [applySnapshot]);

  useEffect(() => {
    refreshSnapshot();
    const interval = setInterval(refreshSnapshot, 30_000);

    return () => clearInterval(interval);
  }, [refreshSnapshot]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof WebSocket === 'undefined') {
      setSocketState('fallback');
      return;
    }

    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (!active) return;

      setSocketState('connecting');
      socket = new WebSocket(MEMPOOL_WEBSOCKET_URL);

      socket.addEventListener('open', () => {
        if (!active || !socket) return;
        setSocketState('open');
        socket.send(JSON.stringify({ action: 'want', data: ['blocks', 'stats'] }));
      });

      socket.addEventListener('message', (event) => {
        if (!active) return;

        try {
          const payload = JSON.parse(String(event.data)) as unknown;
          if (!isRecord(payload)) return;

          const incomingBlocks: BitcoinBlockSummary[] = [];
          if (Array.isArray(payload.blocks)) {
            const normalizedBlocks = payload.blocks.reduce<BitcoinBlockSummary[]>(
              (blocks, block) => {
                const normalized = normalizeSocketBlock(block);
                if (normalized) blocks.push(normalized);
                return blocks;
              },
              [],
            );
            incomingBlocks.push(...normalizedBlocks);
          }

          const singleBlock = normalizeSocketBlock(payload.block);
          if (singleBlock) incomingBlocks.push(singleBlock);

          const mempool = normalizeSocketMempool(payload.mempoolInfo);

          if (incomingBlocks.length === 0 && !mempool) return;

          setLastReceivedAt(Date.now());
          setSnapshot((current) => {
            const recentBlocks = incomingBlocks.length > 0
              ? mergeBlocks(current?.recentBlocks ?? [], incomingBlocks)
              : current?.recentBlocks ?? [];
            const tip = recentBlocks[0] ?? current?.tip;

            if (!tip) return current;

            const previousHeight = latestHeightRef.current;
            latestHeightRef.current = tip.height;

            if (previousHeight !== null && tip.height > previousHeight) {
              setNewBlockHeight(tip.height);
              setAnnouncement(`New Bitcoin block ${numberFormatter.format(tip.height)} found`);
              if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
              celebrationTimerRef.current = setTimeout(() => setNewBlockHeight(null), 12_000);
            }

            return {
              network: 'mainnet',
              source: 'mempool.space live socket',
              checkedAt: new Date().toISOString(),
              tip,
              recentBlocks,
              mempool: mempool ?? current?.mempool ?? null,
            };
          });
        } catch {
          // Ignore malformed socket frames and keep the polling fallback alive.
        }
      });

      socket.addEventListener('error', () => {
        if (active) setSocketState('error');
      });

      socket.addEventListener('close', () => {
        if (!active) return;
        setSocketState('fallback');
        reconnectTimer = setTimeout(connect, 5000);
      });
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  const tip = snapshot?.tip ?? null;
  const recentBlocks = snapshot?.recentBlocks ?? [];
  const secondsSinceBlock = tip ? Math.max(0, (now - tip.timestamp * 1000) / 1000) : 0;
  const blockProgress = Math.min(100, (secondsSinceBlock / TARGET_BLOCK_INTERVAL_SECONDS) * 100);
  const isFresh = lastReceivedAt !== null && now - lastReceivedAt < 90_000;
  const isSocketLive = socketState === 'open' && isFresh;
  const statusLabel = isSocketLive
    ? 'Live socket'
    : isFresh
      ? 'Polling live'
      : socketState === 'connecting'
        ? 'Connecting'
        : 'Reconnecting';
  const statusTone = isSocketLive ? 'text-emerald-200' : isFresh ? 'text-amber-100' : 'text-red-100';
  const statusDot = isSocketLive ? 'bg-emerald-300' : isFresh ? 'bg-amber-300' : 'bg-red-300';
  const nextBlockHint = useMemo(() => {
    if (!tip) return 'Waiting for tip';
    if (secondsSinceBlock < 120) return 'Fresh block';
    if (secondsSinceBlock < TARGET_BLOCK_INTERVAL_SECONDS) return 'Next block building';
    return 'Over target pace';
  }, [secondsSinceBlock, tip]);

  return (
    <section
      id="live-bitcoin"
      className={cn(
        'relative isolate overflow-hidden border-b border-amber-300/15 bg-[linear-gradient(180deg,#07111c_0%,#0b1723_48%,#10151d_100%)] py-12 sm:py-16',
        className,
      )}
      data-testid="live-bitcoin-section"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.7),rgba(45,212,191,0.45),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-[linear-gradient(90deg,rgba(245,158,11,0.10),transparent_38%,rgba(45,212,191,0.08))]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100">
                <Bitcoin className="size-3.5" aria-hidden="true" />
                Mainnet
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]',
                  statusTone,
                )}
                data-testid="bitcoin-connection-status"
              >
                <span className={cn('size-1.5 rounded-full motion-safe:animate-pulse', statusDot)} />
                {statusLabel}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-xl text-3xl font-bold leading-tight text-white text-balance sm:text-5xl">
                Bitcoin is moving through this page.
              </h2>
              <p className="max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                Current chain tip, last-block age, and fresh block events update live from the network.
              </p>
            </div>

            <div
              className={cn(
                'rounded-[1.75rem] border border-white/10 bg-black/25 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur',
                newBlockHeight ? 'motion-safe:animate-[bitcoin-block-found_1300ms_ease-out]' : null,
              )}
              aria-live="polite"
              data-testid="bitcoin-tip-panel"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    <Blocks className="size-4 text-amber-300" aria-hidden="true" />
                    Current block
                  </p>
                  <p className="font-mono text-4xl font-bold leading-none text-white tabular-nums sm:text-6xl" data-testid="bitcoin-block-height">
                    {tip ? numberFormatter.format(tip.height) : '...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-2 flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    <Clock3 className="size-4 text-teal-200" aria-hidden="true" />
                    Since found
                  </p>
                  <p className="font-mono text-3xl font-semibold text-amber-100 tabular-nums sm:text-4xl" data-testid="bitcoin-last-block-age">
                    {tip ? formatElapsed(secondsSinceBlock) : '--'}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb7185,#2dd4bf)] motion-safe:transition-[width] motion-safe:duration-700"
                  style={{ width: `${blockProgress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>{nextBlockHint}</span>
                <span>{tip ? `Hash ${shortHash(tip.hash)}` : 'Hash pending'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="border-l border-amber-300/40 pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Transactions
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
                  {tip ? numberFormatter.format(tip.txCount) : '--'}
                </p>
              </div>
              <div className="border-l border-rose-300/40 pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Mempool
                </p>
                <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
                  {snapshot?.mempool ? compactFormatter.format(snapshot.mempool.transactionCount) : '--'}
                </p>
              </div>
              <div className="col-span-2 border-l border-teal-300/40 pl-4 sm:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Source
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {snapshot?.source ?? 'Connecting'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#050a10]/80 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-6">
            <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(120deg,rgba(245,158,11,0.12),transparent_24%,rgba(45,212,191,0.08)_62%,transparent)]" />
            <div className="absolute inset-x-6 top-20 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.75),rgba(45,212,191,0.65),transparent)] motion-safe:animate-[bitcoin-ledger-scan_4s_linear_infinite]" />

            <div className="relative flex h-full min-h-[380px] flex-col justify-between gap-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Latest blocks
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {tip ? `Tip updated ${formatElapsed(Math.max(0, (now - new Date(snapshot?.checkedAt ?? now).getTime()) / 1000))} ago` : 'Waiting for data'}
                  </p>
                </div>
                <a
                  href="https://mempool.space"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-300/35 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                >
                  Explorer
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              </div>

              <div className="relative flex-1">
                <div className="absolute left-[1.15rem] top-4 h-[calc(100%-2rem)] w-px bg-[linear-gradient(180deg,rgba(245,158,11,0),rgba(245,158,11,0.45),rgba(45,212,191,0.45),rgba(45,212,191,0))]" />
                <ol className="relative space-y-3" role="list" aria-label="Latest Bitcoin blocks">
                  {(recentBlocks.length > 0 ? recentBlocks : Array.from({ length: 6 })).slice(0, 6).map((block, index) => {
                    const typedBlock = block as BitcoinBlockSummary | undefined;
                    const isTip = index === 0;

                    return (
                      <li
                        key={typedBlock?.height ?? `loading-${index}`}
                        className={cn(
                          'relative grid min-h-14 grid-cols-[2.3rem_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-2.5 motion-safe:transition-[transform,border-color,background-color,opacity] motion-safe:duration-300',
                          typedBlock
                            ? 'border-white/10 bg-white/[0.045] hover:border-amber-300/25 hover:bg-white/[0.07]'
                            : 'border-white/5 bg-white/[0.03] opacity-55',
                          isTip && typedBlock ? 'border-amber-300/35 bg-amber-300/[0.08]' : null,
                          isTip && newBlockHeight === typedBlock?.height
                            ? 'motion-safe:animate-[bitcoin-tip-arrive_900ms_ease-out]'
                            : null,
                        )}
                      >
                        <span
                          className={cn(
                            'relative z-10 flex size-9 items-center justify-center rounded-xl border text-xs font-bold',
                            isTip
                              ? 'border-amber-300/45 bg-amber-300/15 text-amber-100'
                              : 'border-white/10 bg-black/30 text-slate-400',
                          )}
                        >
                          {typedBlock ? <Blocks className="size-4" aria-hidden="true" /> : null}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold text-white tabular-nums">
                            {typedBlock ? numberFormatter.format(typedBlock.height) : 'loading'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {typedBlock ? shortHash(typedBlock.hash) : 'connecting to mainnet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                            {typedBlock ? formatBlockTime(typedBlock.timestamp) : '--'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {typedBlock ? `${compactFormatter.format(typedBlock.txCount)} tx` : '--'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-100">
                    <Activity className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Pace
                    </p>
                    <p className="font-mono text-sm font-semibold text-white">{formatElapsed(secondsSinceBlock)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-teal-300/25 bg-teal-300/10 text-teal-100">
                    <Radio className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Feed
                    </p>
                    <p className="font-mono text-sm font-semibold text-white">{isSocketLive ? 'WSS' : 'REST'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-rose-300/25 bg-rose-300/10 text-rose-100">
                    <Wifi className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Fees
                    </p>
                    <p className="font-mono text-sm font-semibold text-white">
                      {tip?.medianFeeSatVb ? `${satsFormatter.format(tip.medianFeeSatVb)} sat/vB` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {newBlockHeight ? (
              <div
                className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-200/15 px-3 py-2 text-xs font-semibold text-amber-50 shadow-[0_14px_40px_rgba(245,158,11,0.24)] backdrop-blur motion-safe:animate-[bitcoin-toast-in_420ms_ease-out]"
                data-testid="bitcoin-new-block-toast"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Block {numberFormatter.format(newBlockHeight)} found
              </div>
            ) : null}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announcement}</p>
      </div>
    </section>
  );
}
