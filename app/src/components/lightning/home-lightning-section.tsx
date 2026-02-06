'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

const NODE_PUBKEY = '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68';
const NODE_ALIAS = 'klabo.world';
const NODE_HOST = 'klabo.world';
const NODE_PORT = 9735;
const LIGHTNING_ADDRESS = 'joel@klabo.world';

const PRESET_AMOUNTS = [21, 100, 500, 1000] as const;

function formatSats(sats: number): string {
  if (sats >= 1000) {
    return `${sats / 1000}k`;
  }
  return sats.toString();
}

function truncatePubkey(pubkey: string, chars = 6): string {
  return `${pubkey.slice(0, chars)}…${pubkey.slice(-chars)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type TipState = 'idle' | 'loading' | 'invoice' | 'success' | 'error';

async function fetchInvoice(amountSats: number): Promise<string> {
  const amountMsat = amountSats * 1000;
  const res = await fetch(`/api/lnurlp/joel/invoice?amount=${amountMsat}&ns=home`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate invoice');
  }
  const data = await res.json();
  return data.pr || data.payment_request;
}

// Lightning bolt icon
function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L4.09 12.11C3.69 12.59 4.03 13.33 4.64 13.33H11V22L19.91 11.89C20.31 11.41 19.97 10.67 19.36 10.67H13V2Z" />
    </svg>
  );
}

// Copy icon
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Check icon
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// External link icon
function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function HomeLightningSection({ className }: { className?: string }) {
  const [copiedField, setCopiedField] = useState<'pubkey' | 'address' | 'invoice' | null>(null);
  const [tipState, setTipState] = useState<TipState>('idle');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const nodeUri = `${NODE_PUBKEY}@${NODE_HOST}:${NODE_PORT}`;

  const handleCopy = useCallback(async (field: 'pubkey' | 'address' | 'invoice', text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleTip = useCallback(async (sats: number) => {
    setSelectedAmount(sats);
    setTipState('loading');
    try {
      const inv = await fetchInvoice(sats);
      setInvoice(inv);
      setTipState('invoice');
    } catch {
      setTipState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setTipState('idle');
    setInvoice(null);
    setSelectedAmount(null);
  }, []);

  const handleMarkPaid = useCallback(() => {
    setTipState('success');
    setTimeout(handleReset, 3000);
  }, [handleReset]);

  return (
    <section className={cn('py-8', className)} data-testid="home-lightning-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <LightningIcon className="h-5 w-5 text-amber-400" />
              Lightning Network
            </h2>
            <p className="text-sm text-muted-foreground">Connect to my node or send a tip.</p>
          </div>
          <a
            href="/about"
            className="px-0 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground hover:text-primary transition-colors"
          >
            More info →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Node Info - Compact */}
          <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-950/20 via-card/70 to-card/70 p-4 shadow-[0_12px_30px_rgba(6,10,20,0.35)]">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20"
                style={{ backgroundColor: '#f7931a' }}
              >
                <LightningIcon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground truncate">{NODE_ALIAS}</h3>
                <p className="text-xs text-muted-foreground">Lightning Node</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Pubkey */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">Pubkey:</span>
                <code className="font-mono text-foreground/80 truncate flex-1">{truncatePubkey(NODE_PUBKEY, 8)}</code>
                <button
                  type="button"
                  onClick={() => handleCopy('pubkey', NODE_PUBKEY)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                  aria-label="Copy public key"
                >
                  {copiedField === 'pubkey' ? (
                    <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <CopyIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Lightning Address */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">Address:</span>
                <code className="font-mono text-amber-300/90 truncate flex-1">{LIGHTNING_ADDRESS}</code>
                <button
                  type="button"
                  onClick={() => handleCopy('address', LIGHTNING_ADDRESS)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                  aria-label="Copy lightning address"
                >
                  {copiedField === 'address' ? (
                    <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <CopyIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <a
                href={`lightning:${nodeUri}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors"
              >
                Connect
                <ExternalIcon className="h-3 w-3" />
              </a>
              <a
                href="https://amboss.space/node/0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              >
                Amboss
                <ExternalIcon className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Tip Widget - Compact */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-background/60 to-background/40 p-4 shadow-[0_12px_30px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-2 mb-3">
              <LightningIcon className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-100/90">Send a Tip</h3>
            </div>

            {tipState === 'idle' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {PRESET_AMOUNTS.map((sats) => (
                    <button
                      key={sats}
                      type="button"
                      onClick={() => handleTip(sats)}
                      className="flex-1 flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2.5 text-center transition-all hover:border-amber-400/60 hover:bg-amber-500/20 hover:-translate-y-0.5"
                    >
                      <span className="text-base font-bold text-amber-100">{formatSats(sats)}</span>
                      <span className="text-[10px] text-amber-200/60">sats</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tipState === 'loading' && (
              <div className="flex items-center justify-center py-6">
                <LightningIcon className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            )}

            {tipState === 'invoice' && invoice && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-background/50 px-2 py-1.5 text-xs font-mono text-foreground/80">
                    {invoice.slice(0, 24)}...
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy('invoice', invoice)}
                    className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-200 hover:bg-amber-500/20 transition-colors"
                    aria-label="Copy invoice"
                  >
                    {copiedField === 'invoice' ? (
                      <CheckIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`lightning:${invoice}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
                  >
                    <LightningIcon className="h-3.5 w-3.5" />
                    Pay {selectedAmount} sats
                  </a>
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/20 transition-colors"
                  >
                    Paid ✓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Cancel
                </button>
              </div>
            )}

            {tipState === 'success' && (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-sm font-semibold text-green-300">Thanks! ⚡</p>
              </div>
            )}

            {tipState === 'error' && (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <p className="text-sm text-red-400">Failed to generate invoice</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
