'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Zap } from 'lucide-react';
import { BitcoinPaymentsGrid, DEFAULT_BITCOIN_ONCHAIN_ADDRESS } from '@/components/lightning';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PAYMENT_HOST,
  DEFAULT_PAYMENT_URL,
  SITE_CANONICAL_URL,
  SITE_NAME,
} from '@/lib/site-config';

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

type PaymentPageClientProps = {
  bitcoinAddress?: string;
};

export function PaymentPageClient({
  bitcoinAddress = DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
}: PaymentPageClientProps) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [originCopied, setOriginCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const res = await fetch('/api/lightning/node-status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as NodeStatus;
        if (active) setNodeStatus(data);
      } catch {
        // The payment widgets keep their static connection details available.
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (!nodeStatus) return 'Checking';
    if (!nodeStatus.reachable) return 'Offline';
    return typeof nodeStatus.latencyMs === 'number'
      ? `Online · ${nodeStatus.latencyMs}ms`
      : 'Online';
  }, [nodeStatus]);

  const copyPayUrl = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_PAYMENT_URL);
      setOriginCopied(true);
      setTimeout(() => setOriginCopied(false), 2000);
    } catch {
      setOriginCopied(false);
    }
  };

  return (
    <section
      className="relative isolate min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#050a14_0%,#07101f_46%,#040812_100%)] text-foreground"
      data-payment-surface="true"
      data-testid="pay-page"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,183,0,0.14)_0%,rgba(255,183,0,0)_32%,rgba(20,184,166,0.10)_62%,rgba(20,184,166,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={SITE_CANONICAL_URL}
            className="rounded text-sm font-semibold uppercase tracking-[0.28em] text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:text-base"
          >
            {SITE_NAME}
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPayUrl}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/72 shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {originCopied ? 'Copied' : DEFAULT_PAYMENT_HOST}
            </button>
            <span
              className={cn(
                'inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.22em]',
                nodeStatus?.reachable
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  : nodeStatus
                    ? 'border-red-400/30 bg-red-400/10 text-red-200'
                    : 'border-white/10 bg-white/5 text-white/60',
              )}
              data-testid="pay-lightning-status"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  nodeStatus?.reachable
                    ? 'bg-emerald-300'
                    : nodeStatus
                      ? 'bg-red-300'
                      : 'bg-white/50',
                )}
              />
              {statusLabel}
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-5 py-5 sm:gap-6 sm:py-8 lg:py-10">
          <div className="max-w-3xl space-y-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Zap className="h-4 w-4 fill-primary" aria-hidden="true" />
              Bitcoin payments
            </p>
            <h1
              className="max-w-2xl text-4xl font-bold leading-[0.98] tracking-tight text-white sm:text-6xl"
              data-testid="pay-page-title"
            >
              {`Pay ${SITE_NAME}`}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/66 sm:text-base">
              Lightning and on-chain Bitcoin in one fast payment view.
            </p>
          </div>

          <BitcoinPaymentsGrid
            namespace="pay"
            node={nodeStatus}
            bitcoinAddress={bitcoinAddress}
            variant="terminal"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
