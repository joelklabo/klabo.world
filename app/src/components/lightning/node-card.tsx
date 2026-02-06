'use client';

import { useCallback, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NodeCardProps = {
  alias?: string;
  pubkey: string;
  color?: string;
  host?: string;
  port?: number;
  numChannels?: number;
  totalCapacity?: number; // in sats
  className?: string;
};

const NODE_PUBKEY = '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68';
const NODE_ALIAS = 'klabo.world';
const NODE_COLOR = '#f7931a';
const NODE_HOST = 'klabo.world';
const NODE_PORT = 9735;

// Default props for klabo.world node
const defaultProps: Partial<NodeCardProps> = {
  alias: NODE_ALIAS,
  pubkey: NODE_PUBKEY,
  color: NODE_COLOR,
  host: NODE_HOST,
  port: NODE_PORT,
};

function formatCapacity(sats: number): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(2)} BTC`;
  }
  if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(1)}M sats`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(0)}k sats`;
  }
  return `${sats} sats`;
}

function truncatePubkey(pubkey: string, chars = 8): string {
  if (pubkey.length <= chars * 2 + 3) return pubkey;
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

export function LightningNodeCard(props: NodeCardProps) {
  const {
    alias = defaultProps.alias,
    pubkey = defaultProps.pubkey!,
    color = defaultProps.color,
    host = defaultProps.host,
    port = defaultProps.port,
    numChannels,
    totalCapacity,
    className,
  } = props;

  const [copiedField, setCopiedField] = useState<'pubkey' | 'uri' | null>(null);
  const [showQR, setShowQR] = useState(false);

  const nodeUri = host ? `${pubkey}@${host}:${port ?? 9735}` : pubkey;

  const handleCopy = useCallback(async (field: 'pubkey' | 'uri') => {
    const text = field === 'pubkey' ? pubkey : nodeUri;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, [pubkey, nodeUri]);

  const explorers = [
    { name: 'Amboss', url: `https://amboss.space/node/${pubkey}` },
    { name: 'Mempool', url: `https://mempool.space/lightning/node/${pubkey}` },
    { name: '1ML', url: `https://1ml.com/node/${pubkey}` },
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/80 to-background/60 p-6 shadow-[0_20px_50px_rgba(var(--primary-rgb),0.12)] backdrop-blur-xl',
        className
      )}
      data-testid="lightning-node-card"
    >
      {/* Glow effects */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: color }}
      />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Node color indicator */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
              style={{ backgroundColor: color }}
            >
              <LightningIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{alias}</h3>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Lightning Node
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            aria-expanded={showQR}
            aria-controls="node-qr-container"
            aria-label={showQR ? 'Hide QR code' : 'Show QR code'}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            data-testid="toggle-qr"
          >
            <QRIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Row */}
        {(numChannels !== undefined || totalCapacity !== undefined) && (
          <div className="flex gap-4">
            {numChannels !== undefined && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Channels
                </p>
                <p className="text-xl font-bold text-foreground" data-testid="channel-count">
                  {numChannels}
                </p>
              </div>
            )}
            {totalCapacity !== undefined && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Capacity
                </p>
                <p className="text-xl font-bold text-foreground" data-testid="total-capacity">
                  {formatCapacity(totalCapacity)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        {showQR && (
          <div id="node-qr-container" className="flex justify-center" data-testid="node-qr-container">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              <QRCodeSVG
                value={nodeUri}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>
        )}

        {/* Pubkey with copy */}
        <div className="space-y-2">
          <span id="pubkey-label" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Public Key
          </span>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground/80"
              title={pubkey}
              aria-labelledby="pubkey-label"
              data-testid="node-pubkey"
            >
              {truncatePubkey(pubkey, 12)}
            </code>
            <Button
              onClick={() => handleCopy('pubkey')}
              aria-label={copiedField === 'pubkey' ? 'Public key copied' : 'Copy public key to clipboard'}
              variant="outline"
              size="icon-sm"
              className="shrink-0"
              data-testid="copy-pubkey"
            >
              {copiedField === 'pubkey' ? (
                <CheckIcon className="h-4 w-4 text-green-400" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Connection URI with copy */}
        {host && (
          <div className="space-y-2">
            <span id="uri-label" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Connection URI
            </span>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground/80"
                title={nodeUri}
                aria-labelledby="uri-label"
                data-testid="node-uri"
              >
                {nodeUri.slice(0, 24)}…:{port}
              </code>
              <Button
                onClick={() => handleCopy('uri')}
                aria-label={copiedField === 'uri' ? 'Connection URI copied' : 'Copy connection URI to clipboard'}
                variant="outline"
                size="icon-sm"
                className="shrink-0"
                data-testid="copy-uri"
              >
                {copiedField === 'uri' ? (
                  <CheckIcon className="h-4 w-4 text-green-400" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Explorer Links */}
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            View on Explorer
          </span>
          <div className="flex flex-wrap gap-2">
            {explorers.map((explorer) => (
              <a
                key={explorer.name}
                href={explorer.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View node on ${explorer.name} (opens in new tab)`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                data-testid={`explorer-${explorer.name.toLowerCase()}`}
              >
                {explorer.name}
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Open Channel CTA */}
        <a
          href={`lightning:${nodeUri}`}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40"
          data-testid="connect-node"
        >
          <LightningIcon className="h-4 w-4" />
          Connect to Open Channel
        </a>
      </div>
    </div>
  );
}

// Icon components
function LightningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 3L4 14h7v7l9-11h-7V3z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function QRIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="18" y="14" width="3" height="3" />
      <rect x="14" y="18" width="3" height="3" />
      <rect x="18" y="18" width="3" height="3" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
