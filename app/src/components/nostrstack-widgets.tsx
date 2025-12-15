'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
// nostr-tools is dynamically imported when needed so builds work without it.

type Relay = {
  url: string;
  connect: () => Promise<void> | void;
  close: () => void;
  publish: (event: NostrEvent) => Promise<string>;
  subscribe: (
    filters: Array<Record<string, unknown>>,
    params: { onevent: (ev: NostrEvent) => void; oneose?: () => void },
  ) => { close: () => void };
};

type NostrSigner = {
  getPublicKey: () => Promise<string>;
  signEvent: (event: NostrEvent) => Promise<NostrEvent>;
};

type NostrWindow = Window & { nostr?: NostrSigner };

const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://relay.snort.social'];
const MIN_MSAT = 1000;

type ActionsProps = {
  slug: string;
  title: string;
  summary?: string;
  canonicalUrl: string;
  lightningAddress?: string | null;
  nostrPubkey?: string | null;
  relays?: string[];
  baseUrl?: string;
  host?: string;
};

type CommentsProps = {
  threadId: string;
  canonicalUrl: string;
  relays?: string[];
};

type NostrSignerState =
  | { hasSigner: false }
  | { hasSigner: true; pubkey?: string };

type NostrEvent = {
  id?: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
};

class NostrstackClient {
  private readonly base: string;
  private readonly host?: string;

  constructor(opts: { baseUrl?: string; host?: string }) {
    this.base = opts.baseUrl?.replace(/\/$/, '') || '';
    this.host = opts.host;
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.base) {
      throw new Error('nostrstack base URL is missing');
    }
    const headers: Record<string, string> = {};
    if (this.host) headers.host = this.host;
    const res = await fetch(`${this.base}${path}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }

  async metadata(username: string) {
    return this.request<{ minSendable?: number }>(`/.well-known/lnurlp/${encodeURIComponent(username)}`);
  }

  async invoice(username: string, amountMsat: number) {
    return this.request<{ pr?: string; payment_request?: string }>(
      `/api/lnurlp/${encodeURIComponent(username)}/invoice?amount=${amountMsat}`,
    );
  }
}

function parseLightningAddress(value?: string | null): { username: string; domain: string } | null {
  if (!value) return null;
  const [username, domain] = value.split('@');
  if (!username || !domain) return null;
  return { username, domain };
}

function isMockConfig(opts: { baseUrl?: string; host?: string }) {
  return opts.baseUrl === 'mock' || opts.host === 'mock';
}

type RelayConnector = {
  connect: (url: string, options?: { enablePing?: boolean; enableReconnect?: boolean }) => Promise<Relay>;
};

function isRelayConnector(value: unknown): value is RelayConnector {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false;
  return typeof (value as { connect?: unknown }).connect === 'function';
}

type RelayConnectResult = {
  connections: Relay[];
  attempted: number;
  failed: number;
};

async function connectRelays(urls: string[]): Promise<RelayConnectResult> {
  if (urls.includes('mock')) return { connections: [], attempted: 0, failed: 0 };
  let connector: RelayConnector | null = null;
  try {
    const mod = await import('nostr-tools');
    const candidate = (mod as unknown as { Relay?: unknown }).Relay ?? null;
    connector = isRelayConnector(candidate) ? candidate : null;
  } catch (err) {
    console.warn('nostr-tools not available, skipping relay connections', err);
    return { connections: [], attempted: urls.length, failed: urls.length };
  }
  if (!connector) return { connections: [], attempted: urls.length, failed: urls.length };

  const attempted = urls.length;
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const relay = await connector.connect(url, { enablePing: true, enableReconnect: true });
      return relay;
    }),
  );

  const connections = results
    .filter((result): result is PromiseFulfilledResult<Relay> => result.status === 'fulfilled')
    .map((result) => result.value);

  return { connections, attempted, failed: attempted - connections.length };
}

function useRelayConnections(relays: string[]) {
  const relayKey = useMemo(() => relays.join('|'), [relays]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [relayState, setRelayState] = useState<{
    key: string;
    attempt: number;
    connections: Relay[];
    attempted: number;
    failed: number;
    status: 'connecting' | 'ready' | 'failed' | 'mock';
  }>(() => ({
    key: relayKey,
    attempt: 0,
    connections: [],
    attempted: 0,
    failed: 0,
    status: relays.includes('mock') ? 'mock' : 'connecting',
  }));

  const isCurrent = relayState.key === relayKey && relayState.attempt === retryIndex;
  const connections = isCurrent ? relayState.connections : [];
  const attempted = isCurrent ? relayState.attempted : 0;
  const failed = isCurrent ? relayState.failed : 0;
  const status = isCurrent ? relayState.status : relays.includes('mock') ? 'mock' : 'connecting';

  const retry = useCallback(() => {
    setRetryIndex((value) => value + 1);
  }, []);

  useEffect(() => {
    let closed = false;
    let active: Relay[] = [];
    (async () => {
      const next = await connectRelays(relays);
      if (closed) {
        next.connections.forEach((relay) => relay.close());
        return;
      }
      active = next.connections;
      const status = next.attempted === 0 ? 'mock' : next.connections.length ? 'ready' : 'failed';
      setRelayState({
        key: relayKey,
        attempt: retryIndex,
        connections: next.connections,
        attempted: next.attempted,
        failed: next.failed,
        status,
      });
    })();

    return () => {
      closed = true;
      active.forEach((relay) => relay.close());
    };
  }, [relayKey, relays, retryIndex]);

  return { connections, attempted, failed, status, retry } as const;
}

async function publishToRelays(relays: Relay[], event: NostrEvent) {
  const timeoutMs = 7000;
  const settled = await Promise.allSettled(
    relays.map(async (relay) => {
      const timer = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`publish timeout (${relay.url ?? 'relay'})`)), timeoutMs),
      );
      await Promise.race([relay.publish(event), timer]);
    }),
  );

  const failures = settled.filter((result) => result.status === 'rejected') as Array<PromiseRejectedResult>;
  if (failures.length === settled.length) {
    const firstError = failures[0]?.reason instanceof Error ? failures[0].reason.message : String(failures[0]?.reason);
    throw new Error(firstError || 'publish failed');
  }

  return { total: settled.length, failed: failures.length };
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'unknown error');
}

async function copyText(text?: string | null) {
  if (!text) return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (error) {
    console.warn('clipboard copy failed', error);
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(12,19,38,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">{title}</p>
      </div>
      <div className="mt-4 space-y-3 text-slate-100">{children}</div>
    </div>
  );
}

export function NostrstackActionBar({
  slug,
  title,
  canonicalUrl,
  lightningAddress,
  nostrPubkey,
  relays,
  baseUrl,
  host,
}: ActionsProps) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [tipState, setTipState] = useState<'idle' | 'loading' | 'error' | 'copied'>('idle');
  const [tipError, setTipError] = useState<string | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'posting' | 'posted' | 'error'>('idle');
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareWarning, setShareWarning] = useState<string | null>(null);
  const relayList = useMemo(() => (relays && relays.length ? relays : DEFAULT_RELAYS), [relays]);
  const { connections, attempted, failed, status, retry } = useRelayConnections(relayList);
  const lightning = useMemo(() => parseLightningAddress(lightningAddress ?? undefined), [lightningAddress]);
  const copyInvoice = useCallback(() => copyText(invoice), [invoice]);
  const mockMode = useMemo(() => isMockConfig({ baseUrl, host }), [baseUrl, host]);
  const [signerAvailable, setSignerAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const checkSigner = () => {
      const signer = (window as NostrWindow).nostr;
      if (!signer) {
        if (!cancelled) setSignerAvailable(false);
        return;
      }

      signer
        .getPublicKey()
        .then(() => {
          if (!cancelled) setSignerAvailable(true);
        })
        .catch(() => {
          if (!cancelled) setSignerAvailable(true);
        });
    };

    checkSigner();

    // Some NIP-07 providers inject `window.nostr` asynchronously; poll briefly.
    const interval = window.setInterval(checkSigner, 500);
    window.addEventListener('focus', checkSigner);

    const timeout = window.setTimeout(() => window.clearInterval(interval), 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener('focus', checkSigner);
    };
  }, []);

  const handleTip = useCallback(async () => {
    if (!lightning) {
      setTipError('Lightning address missing');
      setTipState('error');
      return;
    }
    setTipState('loading');
    setTipError(null);
    try {
      const paymentRequest = mockMode
        ? `lnbc1mock${Math.random().toString(16).slice(2, 10)}`
        : (await (async () => {
            const client = new NostrstackClient({ baseUrl, host: host ?? lightning.domain });
            const meta = await client.metadata(lightning.username);
            const amount = Math.max(meta?.minSendable ?? MIN_MSAT, MIN_MSAT);
            const { pr, payment_request } = await client.invoice(lightning.username, amount);
            return pr ?? payment_request;
          })());
      if (!paymentRequest) {
        throw new Error('Missing invoice payload');
      }
      setInvoice(paymentRequest);
      await copyInvoice();
      setTipState('copied');
    } catch (error) {
      setTipError(formatError(error));
      setTipState('error');
    }
  }, [lightning, baseUrl, host, copyInvoice, mockMode]);

  const handleShare = useCallback(async () => {
    const note = `${title}\n${canonicalUrl}${lightningAddress ? `\n⚡️ ${lightningAddress}` : ''}`;
    setShareError(null);
    setShareWarning(null);

    if (typeof window === 'undefined') {
      setShareError('NIP-07 signer required to share.');
      return;
    }
    const signer = (window as NostrWindow).nostr;
    if (!signer) {
      setShareError('NIP-07 signer required to share.');
      return;
    }
    if (!connections.length) {
      setShareError('No relay connections. Please try again when relays are ready.');
      return;
    }

    setShareState('posting');
    try {
      const pubkey = await signer.getPublicKey();
      const unsigned: NostrEvent = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', slug],
          ['r', canonicalUrl],
          ...(nostrPubkey ? [['p', nostrPubkey]] : []),
        ],
        content: note,
        pubkey,
      };
      const signed = await signer.signEvent(unsigned);
      const result = await publishToRelays(connections, signed);
      if (result.failed > 0) {
        setShareWarning(`Posted, but ${result.failed}/${result.total} relays failed.`);
      }
      setShareState('posted');
    } catch (error) {
      setShareError(formatError(error));
      setShareState('error');
    }
  }, [canonicalUrl, connections, lightningAddress, nostrPubkey, slug, title]);

  return (
    <Section title="Support & Share">
      <p className="text-sm text-slate-200">
        Tip with Lightning, or share to Nostr. Uses the relays {relayList.slice(0, 3).join(', ')}.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="nostrstack-tip"
          onClick={handleTip}
          disabled={!lightning || (!baseUrl && !mockMode) || tipState === 'loading'}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200/50"
        >
          {tipState === 'loading' ? 'Generating…' : lightning ? 'Send sats' : 'Lightning missing'}
        </button>
        <button
          type="button"
          data-testid="nostrstack-share"
          onClick={handleShare}
          disabled={
            shareState === 'posting' ||
            status === 'connecting' ||
            (status !== 'mock' && !connections.length)
          }
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-200/70 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {shareState === 'posting' ? 'Posting…' : 'Share to Nostr'}
        </button>
        {status === 'connecting' ? (
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Connecting relays…</span>
        ) : status === 'failed' ? (
          <span className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-rose-200">
            No relays connected
            <button
              type="button"
              onClick={retry}
              className="rounded-full border border-rose-200/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-100 hover:bg-rose-100/10"
            >
              Retry
            </button>
          </span>
        ) : status === 'mock' ? (
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Relays: mock</span>
        ) : failed > 0 ? (
          <span className="text-xs uppercase tracking-[0.25em] text-amber-100/80">
            Relays {connections.length}/{attempted}
          </span>
        ) : (
          <span className="text-xs uppercase tracking-[0.25em] text-amber-100/80">Relays ready</span>
        )}
      </div>
      {!signerAvailable && (
        <p className="text-sm text-amber-200">NIP-07 signer not detected. Please enable your Nostr extension to share.</p>
      )}
      {invoice && (
        <div className="rounded-2xl border border-amber-200/40 bg-amber-50/10 p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-100">
            <span>Invoice</span>
            <button
              type="button"
              onClick={copyInvoice}
              className="rounded-full border border-amber-200/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-100/10"
            >
              Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-all text-amber-50">{invoice}</pre>
          <a
            href={`lightning:${invoice}`}
            className="mt-2 inline-flex text-sm font-semibold text-amber-100 underline"
          >
            Open in wallet
          </a>
        </div>
      )}
      {tipError && <p className="text-sm text-rose-200">{tipError}</p>}
      {shareWarning && <p className="text-sm text-amber-200">{shareWarning}</p>}
      {shareError && <p className="text-sm text-rose-200">{shareError}</p>}
      {shareState === 'posted' && !shareError && <p className="text-sm text-emerald-200">Shared to Nostr.</p>}
    </Section>
  );
}

export function NostrstackComments({ threadId, relays, canonicalUrl }: CommentsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [signerState, setSignerState] = useState<NostrSignerState>({ hasSigner: false });
  const relayList = useMemo(() => (relays && relays.length ? relays : DEFAULT_RELAYS), [relays]);
  const isMockMode = relayList.includes('mock');
  const { connections, status, retry } = useRelayConnections(relayList);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // detect signer once
    const signer = (typeof window !== 'undefined' ? (window as NostrWindow).nostr : null);
    if (signer) {
      signer
        .getPublicKey()
        .then((pubkey) => setSignerState({ hasSigner: true, pubkey }))
        .catch(() => setSignerState({ hasSigner: true }));
    } else {
      setSignerState({ hasSigner: false });
    }
  }, []);

  useEffect(() => {
    if (!connections.length) return;
    const subs: Array<{ close: () => void }> = [];
    const filters: Array<{ kinds: number[]; '#t': string[] }> = [{ kinds: [1], '#t': [threadId] }];
    connections.forEach((relay) => {
      const sub = relay.subscribe(filters, {
        onevent: (ev: NostrEvent) => {
          if (ev?.id && seenIds.current.has(ev.id)) return;
          if (ev?.id) seenIds.current.add(ev.id);
          setEvents((prev) => [...prev, ev]);
        },
      });
      subs.push(sub);
    });
    return () => {
      subs.forEach((sub) => sub.close());
    };
  }, [connections, threadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return;
    const signer = (window as NostrWindow).nostr;
    if (!signer) {
      setError('Nostr signer (NIP-07) required to post.');
      return;
    }
    try {
      setPosting(true);
      const pubkey = await signer.getPublicKey();
      const unsigned: NostrEvent = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', threadId],
          ['r', canonicalUrl],
        ],
        content: content.trim(),
        pubkey,
      };
      const signed = await signer.signEvent(unsigned);
      await publishToRelays(connections, signed);
      if (signed.id) seenIds.current.add(signed.id);
      setEvents((prev) => [...prev, signed]);
      setContent('');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <Section title="Comments (Nostr)">
      <p className="text-sm text-slate-300">
        Relays: {relayList.join(', ')}. NIP-07 signer required to post.
      </p>
      {status === 'connecting' ? (
        <p className="text-sm text-slate-400">Connecting to relays…</p>
      ) : status === 'failed' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/20 bg-rose-200/5 p-3 text-sm text-rose-100">
          <p>No relays connected. Comments may be unavailable.</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full border border-rose-200/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-100 hover:bg-rose-100/10"
          >
            Retry
          </button>
        </div>
      ) : null}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Add a comment via Nostr"
          className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-200/60 focus:outline-none"
        />
        <div className="flex items-center justify-between text-sm text-slate-400">
          <button
            type="submit"
            disabled={posting || (status === 'connecting' && !isMockMode) || (!connections.length && !isMockMode) || !signerState.hasSigner}
            data-testid="nostrstack-comment-submit"
            className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post comment'}
          </button>
          <span>{events.length} note{events.length === 1 ? '' : 's'}</span>
        </div>
      </form>
      {!signerState.hasSigner && (
        <p className="text-sm text-amber-200">
          NIP-07 signer not detected. Install/enable a Nostr browser extension (e.g., Alby, nos2x), then refresh to post.
        </p>
      )}
      {error && <p className="text-sm text-rose-200">{error}</p>}
      <div className="space-y-3">
        {events.length === 0 && status !== 'connecting' && (
          <p className="text-sm text-slate-300">No comments yet.</p>
        )}
        {events
          .slice()
          .reverse()
          .map((ev) => (
            <div
              key={ev.id ?? `${ev.pubkey}-${ev.created_at}-${Math.random()}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-amber-100/80">{ev.pubkey.slice(0, 8)}…</p>
              <p className="mt-2 text-sm text-slate-100 whitespace-pre-wrap break-words">{ev.content}</p>
            </div>
          ))}
      </div>
    </Section>
  );
}
