'use client';

import { useCallback, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TipState = 'idle' | 'loading' | 'invoice' | 'error';

type TipWidgetProps = {
  lightningAddress: string;
  className?: string;
};

const PRESET_AMOUNTS = [21, 100, 500, 1000] as const;
const MIN_SATS = 1;
const MAX_SATS = 1_000_000;

function formatSats(sats: number): string {
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(sats % 1000 === 0 ? 0 : 1)}k`;
  }
  return sats.toString();
}

async function fetchInvoice(lightningAddress: string, amountSats: number): Promise<string> {
  const [username] = lightningAddress.split('@');
  if (!username) throw new Error('Invalid lightning address');
  
  const amountMsat = amountSats * 1000;
  const res = await fetch(`/api/lnurlp/${encodeURIComponent(username)}/invoice?amount=${amountMsat}`);
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `Failed to generate invoice (${res.status})`);
  }
  
  const data = await res.json();
  const invoice = data.pr || data.payment_request;
  if (!invoice) throw new Error('No invoice in response');
  return invoice;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function LightningTipWidget({ lightningAddress, className }: TipWidgetProps) {
  const [state, setState] = useState<TipState>('idle');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAmountSelect = useCallback(async (sats: number) => {
    setSelectedAmount(sats);
    setError(null);
    setState('loading');
    
    try {
      const inv = await fetchInvoice(lightningAddress, sats);
      setInvoice(inv);
      setState('invoice');
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to generate invoice');
      setState('error');
    }
  }, [lightningAddress]);

  const handleCustomSubmit = useCallback(() => {
    const sats = Number.parseInt(customAmount, 10);
    if (!Number.isFinite(sats) || sats < MIN_SATS || sats > MAX_SATS) {
      setError(`Enter between ${MIN_SATS} and ${formatSats(MAX_SATS)} sats`);
      return;
    }
    handleAmountSelect(sats);
  }, [customAmount, handleAmountSelect]);

  const handleCopy = useCallback(async () => {
    if (!invoice) return;
    const success = await copyToClipboard(invoice);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [invoice]);

  const handleReset = useCallback(() => {
    setState('idle');
    setSelectedAmount(null);
    setCustomAmount('');
    setInvoice(null);
    setError(null);
    setCopied(false);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-background/80 to-background/60 p-6 shadow-[0_20px_50px_rgba(245,158,11,0.15)] backdrop-blur-xl',
        className
      )}
      data-testid="lightning-tip-widget"
    >
      {/* Glow effect */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <LightningIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/90">
              Send a Tip
            </h3>
            <p className="text-xs text-muted-foreground">{lightningAddress}</p>
          </div>
        </div>

        {/* Amount Selection */}
        {state === 'idle' && (
          <div className="space-y-4" data-testid="tip-amount-selection">
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((sats) => (
                <button
                  key={sats}
                  type="button"
                  onClick={() => handleAmountSelect(sats)}
                  data-testid={`tip-amount-${sats}`}
                  className={cn(
                    'group relative min-w-[4.5rem] rounded-full border px-4 py-2.5 text-sm font-semibold transition-all',
                    'border-amber-500/30 bg-amber-500/10 text-amber-100 hover:border-amber-400/60 hover:bg-amber-500/20 hover:-translate-y-0.5',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <LightningIcon className="h-3.5 w-3.5 text-amber-400" />
                    {formatSats(sats)}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                placeholder="Custom sats"
                aria-label="Custom amount in satoshis"
                min={MIN_SATS}
                max={MAX_SATS}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                data-testid="tip-custom-input"
              />
              <Button
                onClick={handleCustomSubmit}
                disabled={!customAmount}
                variant="soft"
                size="sm"
                className="border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                data-testid="tip-custom-submit"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6" data-testid="tip-loading">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-400" />
              <LightningIcon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-amber-400" />
            </div>
            <p className="text-sm text-amber-100/80">
              Generating invoice for {selectedAmount && formatSats(selectedAmount)} sats…
            </p>
          </div>
        )}

        {/* Invoice Display */}
        {state === 'invoice' && invoice && (
          <div className="space-y-4" data-testid="tip-invoice-display">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-lg" data-testid="invoice-qr">
                <QRCodeSVG
                  value={`lightning:${invoice.toUpperCase()}`}
                  size={220}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <code
                  className="flex-1 truncate text-xs text-amber-100/80"
                  data-testid="invoice-text"
                >
                  {invoice.slice(0, 40)}…
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? 'Invoice copied' : 'Copy invoice to clipboard'}
                  className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                  data-testid="copy-invoice"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={`lightning:${invoice}`}
                  className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-amber-500/40"
                  data-testid="open-wallet"
                >
                  <span className="flex items-center justify-center gap-2">
                    <LightningIcon className="h-4 w-4" />
                    Open in Wallet
                  </span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Go back to amount selection"
                  className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
                  data-testid="tip-reset"
                >
                  ←
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-amber-100/60">
              Sending {selectedAmount && formatSats(selectedAmount)} sats via Lightning ⚡
            </p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="space-y-3" data-testid="tip-error">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 3L4 14h7v7l9-11h-7V3z" />
    </svg>
  );
}
