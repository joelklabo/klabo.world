'use client';

import { useCallback, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

type TipState = 'idle' | 'loading' | 'invoice' | 'success' | 'error';

type TipWidgetProps = {
  lightningAddress: string;
  className?: string;
  /** Compact mode for embedding in smaller spaces */
  compact?: boolean;
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

  const handleMarkPaid = useCallback(() => {
    setState('success');
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
          <div className="space-y-3" data-testid="tip-amount-selection">
            {/* Preset amounts in a grid */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((sats) => (
                <button
                  key={sats}
                  type="button"
                  onClick={() => handleAmountSelect(sats)}
                  data-testid={`tip-amount-${sats}`}
                  className={cn(
                    'group flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all',
                    'border-amber-500/30 bg-amber-500/10 hover:border-amber-400/60 hover:bg-amber-500/20 hover:-translate-y-0.5',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  <LightningIcon className="mb-1 h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-100">{formatSats(sats)}</span>
                  <span className="text-[10px] text-amber-200/60">sats</span>
                </button>
              ))}
            </div>

            {/* Custom amount - more compact */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                  placeholder="Custom amount"
                  aria-label="Custom amount in satoshis"
                  min={MIN_SATS}
                  max={MAX_SATS}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-12 text-sm text-white placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  data-testid="tip-custom-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">sats</span>
              </div>
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customAmount}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                  'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
                  'hover:-translate-y-0.5 hover:shadow-amber-500/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
                )}
                data-testid="tip-custom-submit"
              >
                <LightningIcon className="h-4 w-4" />
              </button>
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
              <div className="rounded-2xl bg-white p-3 shadow-lg shadow-amber-500/20" data-testid="invoice-qr">
                <QRCodeSVG
                  value={`lightning:${invoice.toUpperCase()}`}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <code
                  className="flex-1 truncate text-xs text-amber-100/80"
                  data-testid="invoice-text"
                >
                  {invoice.slice(0, 32)}…
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? 'Invoice copied' : 'Copy invoice to clipboard'}
                  className="shrink-0 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                  data-testid="copy-invoice"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`lightning:${invoice}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-amber-500/40"
                  data-testid="open-wallet"
                >
                  <LightningIcon className="h-4 w-4" />
                  Open Wallet
                </a>
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/20 hover:-translate-y-0.5"
                  data-testid="mark-paid"
                >
                  <CheckIcon className="h-4 w-4" />
                  I&#39;ve Paid
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
                data-testid="tip-reset"
              >
                ← Different amount
              </button>
            </div>

            <p className="text-center text-xs text-amber-100/50">
              {selectedAmount && formatSats(selectedAmount)} sats via Lightning ⚡
            </p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="space-y-3" data-testid="tip-error">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="flex flex-col items-center gap-4 py-6" data-testid="tip-success">
            <div className="relative">
              {/* Animated rings */}
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
              <div className="absolute inset-[-8px] animate-pulse rounded-full bg-emerald-400/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
                <CheckIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-100">Payment Received!</p>
              <p className="mt-1 text-sm text-emerald-200/80">
                Thank you for the {selectedAmount && formatSats(selectedAmount)} sats ⚡
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-6 py-2 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-500/20"
              data-testid="tip-another"
            >
              Send Another Tip
            </button>
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
