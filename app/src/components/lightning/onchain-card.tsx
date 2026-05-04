'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bitcoin, Check, Copy, ExternalLink, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

type OnchainAddressInfo = {
  address: string;
  uri: string;
  source: 'static' | 'rotating-pool';
  poolSize: number;
  rotation: 'none' | 'daily';
  index: number;
};

type BitcoinOnchainCardProps = {
  address?: string;
  className?: string;
};

const DEFAULT_BITCOIN_ONCHAIN_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';

function truncateAddress(address: string): string {
  if (address.length <= 24) {
    return address;
  }
  return `${address.slice(0, 12)}...${address.slice(-10)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function BitcoinOnchainCard({
  address = DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
  className,
}: BitcoinOnchainCardProps) {
  const [addressInfo, setAddressInfo] = useState<OnchainAddressInfo>({
    address,
    uri: `bitcoin:${address}`,
    source: 'static',
    poolSize: 1,
    rotation: 'none',
    index: 0,
  });
  const [copiedField, setCopiedField] = useState<'address' | 'uri' | null>(null);

  useEffect(() => {
    let active = true;

    const loadAddress = async () => {
      try {
        const res = await fetch('/api/bitcoin/onchain-address', { cache: 'no-store' });
        if (!res.ok) return;
        const next = (await res.json()) as OnchainAddressInfo;
        if (active && next.address) {
          setAddressInfo(next);
        }
      } catch {
        // Keep the static address visible when the rotating address endpoint is unavailable.
      }
    };

    loadAddress();
    return () => {
      active = false;
    };
  }, []);

  const rotationLabel = addressInfo.source === 'rotating-pool'
    ? 'Daily rotating address'
    : 'Receive address';
  const mempoolUrl = useMemo(
    () => `https://mempool.space/address/${addressInfo.address}`,
    [addressInfo.address],
  );

  const handleCopy = useCallback(async (field: 'address' | 'uri', text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-orange-400/20 bg-[radial-gradient(circle_at_top_right,rgba(247,147,26,0.24),transparent_32%),linear-gradient(135deg,rgba(12,18,30,0.96),rgba(20,24,32,0.78))] p-4 shadow-[0_18px_45px_rgba(6,10,20,0.36)]',
        className,
      )}
      data-testid="bitcoin-onchain-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/25">
            <Bitcoin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-orange-50">On-chain Bitcoin</h3>
            <p className="text-xs text-orange-100/58">{rotationLabel}</p>
          </div>
        </div>
        <div className="rounded-lg border border-orange-300/20 bg-black/20 p-1.5 text-orange-100/70">
          <QrCode className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[132px_minmax(0,1fr)]">
        <a
          href={addressInfo.uri}
          className="mx-auto flex h-[132px] w-[132px] items-center justify-center rounded-xl bg-white p-2 shadow-[0_16px_32px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-0.5"
          aria-label="Open Bitcoin wallet"
        >
          <QRCodeSVG
            value={addressInfo.uri}
            size={116}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </a>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-orange-100/50">
              Bitcoin address
            </p>
            <code
              className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-orange-50/86"
              title={addressInfo.address}
              data-testid="bitcoin-onchain-address"
            >
              <span className="hidden sm:inline">{truncateAddress(addressInfo.address)}</span>
              <span className="break-all sm:hidden">{addressInfo.address}</span>
            </code>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCopy('address', addressInfo.address)}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-orange-300/25 bg-orange-400/10 px-3 text-xs font-semibold text-orange-50 transition-colors hover:bg-orange-400/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
              data-testid="copy-onchain-address"
            >
              {copiedField === 'address' ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copiedField === 'address' ? 'Copied' : 'Copy'}
            </button>
            <a
              href={addressInfo.uri}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-orange-400 px-3 text-xs font-semibold text-slate-950 transition-colors hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              data-testid="open-onchain-wallet"
            >
              Wallet
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <a
            href={mempoolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-100/48 transition-colors hover:text-orange-100"
          >
            View on mempool →
          </a>
        </div>
      </div>
    </div>
  );
}
