'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BitcoinPaymentsGrid, DEFAULT_BITCOIN_ONCHAIN_ADDRESS } from './payments-grid';

type NodeStatus = {
  alias: string;
  pubkey: string;
  host: string;
  port: number;
  uri: string;
  reachable: boolean;
  latencyMs: number | null;
  checkedAt: string;
  source: string;
};

type HomeLightningSectionProps = {
  className?: string;
  bitcoinAddress?: string;
};

export function HomeLightningSection({
  className,
  bitcoinAddress = DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
}: HomeLightningSectionProps) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const res = await fetch('/api/lightning/node-status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as NodeStatus;
        if (active) setNodeStatus(data);
      } catch {
        // Keep connection details available when the status endpoint is unreachable.
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const statusLabel = nodeStatus
    ? nodeStatus.reachable
      ? 'Online'
      : 'Offline'
    : 'Checking';
  const statusDetail =
    nodeStatus?.reachable && typeof nodeStatus.latencyMs === 'number'
      ? `${statusLabel} · ${nodeStatus.latencyMs}ms`
      : statusLabel;

  return (
    <section
      className={cn('border-b border-border/30 py-8 sm:py-10', className)}
      data-testid="home-lightning-section"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold leading-tight text-foreground">
                <Zap className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                Bitcoin Payments
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]',
                  nodeStatus?.reachable
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : nodeStatus
                      ? 'border-red-400/30 bg-red-400/10 text-red-200'
                      : 'border-border/60 bg-background/50 text-muted-foreground',
                )}
                data-testid="lightning-node-status"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    nodeStatus?.reachable
                      ? 'bg-emerald-300'
                      : nodeStatus
                        ? 'bg-red-300'
                        : 'bg-muted-foreground',
                  )}
                />
                {statusDetail}
              </span>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Open a channel, send a Lightning tip, or use a regular on-chain Bitcoin transaction.
            </p>
          </div>
          <a
            href="/about"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            More info
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <BitcoinPaymentsGrid namespace="home" node={nodeStatus} bitcoinAddress={bitcoinAddress} />
      </div>
    </section>
  );
}
