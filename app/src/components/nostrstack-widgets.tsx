'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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

type NostrProfile = {
  name?: string;
  display_name?: string;
  picture?: string;
  nip05?: string;
};

type RelayStatus = 'connecting' | 'ready' | 'failed' | 'mock';

function safeHttpUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // ignore
  }
  return null;
}

function parseProfile(content: string): NostrProfile | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    return {
      name: typeof obj.name === 'string' ? obj.name : undefined,
      display_name: typeof obj.display_name === 'string' ? obj.display_name : undefined,
      picture: typeof obj.picture === 'string' ? obj.picture : undefined,
      nip05: typeof obj.nip05 === 'string' ? obj.nip05 : undefined,
    };
  } catch {
    return null;
  }
}

function getProfileLabel(profile: NostrProfile | undefined, pubkey: string) {
  const candidate = profile?.display_name || profile?.name || profile?.nip05;
  if (candidate && candidate.trim()) return candidate.trim();
  return `${pubkey.slice(0, 8)}…`;
}

function relativeTimeLabel(epochSeconds: number) {
  const now = Date.now();
  const then = epochSeconds * 1000;
  const diff = Math.max(0, now - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'now';
  if (diff < hour) return `${Math.round(diff / minute)}m`;
  if (diff < day) return `${Math.round(diff / hour)}h`;
  return `${Math.round(diff / day)}d`;
}

function hasTag(tags: string[][], key: string, value: string) {
  return tags.some((tag) => tag[0] === key && tag[1] === value);
}

function Avatar({
  pubkey,
  profile,
  size = 28,
  className = '',
}: {
  pubkey: string;
  profile?: NostrProfile;
  size?: number;
  className?: string;
}) {
  const label = getProfileLabel(profile, pubkey);
  const picture = safeHttpUrl(profile?.picture);
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-white/10 to-white/5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
      title={label}
    >
      {picture ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picture}
            alt={label}
            width={size}
            height={size}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </>
      ) : (
        <span className="select-none">{initial}</span>
      )}
    </div>
  );
}

function AvatarStack({
  pubkeys,
  profiles,
  max = 4,
  size = 28,
}: {
  pubkeys: string[];
  profiles: Record<string, NostrProfile>;
  max?: number;
  size?: number;
}) {
  const items = pubkeys.slice(0, max);
  const extra = Math.max(0, pubkeys.length - items.length);

  return (
    <div className="group flex items-center">
      {items.map((pubkey, index) => (
        <div
          key={pubkey}
          style={{ '--dx': `${index * 10}px` } as CSSProperties}
          className="-ml-2 transition-transform duration-300 ease-out group-hover:translate-x-[var(--dx)]"
        >
          <Avatar pubkey={pubkey} profile={profiles[pubkey]} size={size} className="ring-2 ring-[#0d1428]" />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className="-ml-2 transition-transform duration-300 ease-out group-hover:translate-x-[var(--dx)]"
          style={{ '--dx': `${items.length * 10}px` } as CSSProperties}
        >
          <div
            className="grid place-items-center rounded-full border border-white/15 bg-white/5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/80 ring-2 ring-[#0d1428]"
            style={{ width: size, height: size }}
            title={`${extra} more`}
          >
            +{extra}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  } catch (error) {
    console.warn('nostr-tools not available, skipping relay connections', error);
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
    status: RelayStatus;
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
  const status = isCurrent ? relayState.status : (relays.includes('mock') ? 'mock' : 'connecting');

  const retry = useCallback(() => {
    setRetryIndex((value) => value + 1);
  }, []);

  useEffect(() => {
    let closed = false;
    let active: Relay[] = [];
    (async () => {
      const next = await connectRelays(relays);
      if (closed) {
        for (const relay of next.connections) relay.close();
        return;
      }
      active = next.connections;
      const status = next.attempted === 0 ? 'mock' : (next.connections.length > 0 ? 'ready' : 'failed');
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
      for (const relay of active) relay.close();
    };
  }, [relayKey, relays, retryIndex]);

  return { connections, attempted, failed, status, retry } as const;
}

async function fetchProfilesFromRelays(connections: Relay[], pubkeys: string[], timeoutMs = 3500) {
  if (connections.length === 0 || pubkeys.length === 0) return {} as Record<string, NostrProfile>;

  const latestByPubkey = new Map<string, NostrEvent>();

  await new Promise<void>((resolve) => {
    let remaining = connections.length;
    const subs: Array<{ close: () => void }> = [];

    const finalize = () => {
      for (const sub of subs) sub.close();
      resolve();
    };

    const timer = setTimeout(finalize, timeoutMs);

    for (const relay of connections) {
      const sub = relay.subscribe(
        [
          {
            kinds: [0],
            authors: pubkeys,
          },
        ],
        {
          onevent: (ev: NostrEvent) => {
            if (ev.kind !== 0) return;
            if (!pubkeys.includes(ev.pubkey)) return;
            const prev = latestByPubkey.get(ev.pubkey);
            if (!prev || ev.created_at > prev.created_at) {
              latestByPubkey.set(ev.pubkey, ev);
            }
          },
          oneose: () => {
            remaining -= 1;
            if (remaining <= 0) {
              clearTimeout(timer);
              finalize();
            }
          },
        },
      );
      subs.push(sub);
    }
  });

  const profiles: Record<string, NostrProfile> = {};
  for (const [pubkey, ev] of latestByPubkey.entries()) {
    const profile = parseProfile(ev.content);
    if (profile) {
      profiles[pubkey] = profile;
    }
  }
  return profiles;
}

function useNostrShareActivity({
  slug,
  canonicalUrl,
  connections,
  status,
  isRelayMock,
  maxEvents = 50,
}: {
  slug: string;
  canonicalUrl: string;
  connections: Relay[];
  status: RelayStatus;
  isRelayMock: boolean;
  maxEvents?: number;
}) {
  const [shares, setShares] = useState<NostrEvent[]>([]);
  const [loaded, setLoaded] = useState(isRelayMock);
  const [profiles, setProfiles] = useState<Record<string, NostrProfile>>({});
  const seenIds = useRef<Set<string>>(new Set());
  const requestedProfiles = useRef<Set<string>>(new Set());

  const addShare = useCallback(
    (ev: NostrEvent) => {
      if (ev.kind !== 1) return;
      if (!hasTag(ev.tags ?? [], 'r', canonicalUrl) && !hasTag(ev.tags ?? [], 't', slug)) {
        return;
      }
      if (ev.id && seenIds.current.has(ev.id)) return;
      if (ev.id) seenIds.current.add(ev.id);

      setShares((prev) => {
        const next = [ev, ...prev];
        next.sort((a, b) => b.created_at - a.created_at);
        return next.slice(0, maxEvents);
      });
    },
    [canonicalUrl, maxEvents, slug],
  );

  useEffect(() => {
    if (isRelayMock || status !== 'ready' || connections.length === 0) return;

    let closed = false;
    let eoseCount = 0;
    const markLoaded = () => {
      if (closed) return;
      setLoaded(true);
    };

    const filters: Array<Record<string, unknown>> = [
      { kinds: [1], '#r': [canonicalUrl] },
      { kinds: [1], '#t': [slug] },
    ];

    const subs = connections.map((relay) =>
      relay.subscribe(filters, {
        onevent: (ev: NostrEvent) => addShare(ev),
        oneose: () => {
          eoseCount += 1;
          if (eoseCount >= connections.length) {
            markLoaded();
          }
        },
      }),
    );

    const timer = setTimeout(markLoaded, 3500);

    return () => {
      closed = true;
      clearTimeout(timer);
      for (const sub of subs) sub.close();
    };
  }, [addShare, canonicalUrl, connections, isRelayMock, slug, status]);

  const sharers = useMemo(() => {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const ev of shares) {
      if (seen.has(ev.pubkey)) continue;
      seen.add(ev.pubkey);
      result.push(ev.pubkey);
      if (result.length >= 24) break;
    }
    return result;
  }, [shares]);

  useEffect(() => {
    if (isRelayMock || status !== 'ready' || connections.length === 0) return;
    const nextPubkeys = sharers
      .filter((pubkey) => !profiles[pubkey] && !requestedProfiles.current.has(pubkey))
      .slice(0, 24);
    if (nextPubkeys.length === 0) return;

    for (const pubkey of nextPubkeys) requestedProfiles.current.add(pubkey);

    let cancelled = false;
    fetchProfilesFromRelays(connections, nextPubkeys).then((nextProfiles) => {
      if (cancelled) return;
      const entries = Object.entries(nextProfiles);
      if (entries.length === 0) return;
      setProfiles((prev) => ({ ...prev, ...nextProfiles }));
    });

    return () => {
      cancelled = true;
    };
  }, [connections, isRelayMock, profiles, sharers, status]);

  return {
    shares,
    sharers,
    profiles,
    loaded,
    shareCount: shares.length,
    addShare,
  } as const;
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

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(12,19,38,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/80">{title}</p>
        {right}
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
  const relayList = useMemo(() => (relays && relays.length > 0 ? relays : DEFAULT_RELAYS), [relays]);
  const { connections, attempted, failed, status, retry } = useRelayConnections(relayList);
  const isRelayMock = relayList.includes('mock');
  const lightning = useMemo(() => parseLightningAddress(lightningAddress ?? undefined), [lightningAddress]);
  const copyInvoice = useCallback(() => copyText(invoice), [invoice]);
  const mockMode = useMemo(() => isMockConfig({ baseUrl, host }), [baseUrl, host]);
  const [signerAvailable, setSignerAvailable] = useState(false);
  const { shareCount, sharers, profiles, loaded: sharesLoaded, addShare } = useNostrShareActivity({
    slug,
    canonicalUrl,
    connections,
    status,
    isRelayMock,
  });

  useEffect(() => {
    if (globalThis.window === undefined) return;
    let cancelled = false;

    const checkSigner = () => {
      const signer = (globalThis as NostrWindow).nostr;
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
    const interval = globalThis.setInterval(checkSigner, 500);
    window.addEventListener('focus', checkSigner);

    const timeout = globalThis.setTimeout(() => globalThis.clearInterval(interval), 8000);

    return () => {
      cancelled = true;
      globalThis.clearInterval(interval);
      globalThis.clearTimeout(timeout);
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

    if (globalThis.window === undefined) {
      setShareError('NIP-07 signer required to share.');
      return;
    }
    const signer = (globalThis as NostrWindow).nostr;
    if (!signer) {
      setShareError('NIP-07 signer required to share.');
      return;
    }
    if (connections.length === 0) {
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
      addShare(signed);
      setShareState('posted');
    } catch (error) {
      setShareError(formatError(error));
      setShareState('error');
    }
  }, [addShare, canonicalUrl, connections, lightningAddress, nostrPubkey, slug, title]);

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
          {tipState === 'loading' ? 'Generating…' : (lightning ? 'Send sats' : 'Lightning missing')}
        </button>
        <button
          type="button"
          data-testid="nostrstack-share"
          onClick={handleShare}
          disabled={
            shareState === 'posting' ||
            status === 'connecting' ||
            (status !== 'mock' && connections.length === 0)
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
      <div
        className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/2 to-amber-50/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        data-testid="nostrstack-share-activity"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {shareCount > 0 ? (
              <AvatarStack pubkeys={sharers} profiles={profiles} max={4} size={28} />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-200/60 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]" />
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Omnoster</p>
              {status === 'failed' ? (
                <p className="text-sm text-rose-100">Share feed unavailable</p>
              ) : status === 'connecting' ? (
                <p className="text-sm text-slate-200">Connecting…</p>
              ) : !sharesLoaded && !isRelayMock ? (
                <p className="text-sm text-slate-200">Scanning relays…</p>
              ) : (
                <p className="text-sm text-slate-200">
                  <span
                    key={shareCount}
                    className="animate-in fade-in zoom-in-95 duration-300 font-semibold text-white"
                    data-testid="nostrstack-share-count"
                  >
                    {shareCount}
                  </span>{' '}
                  share{shareCount === 1 ? '' : 's'}
                  {sharers.length > 0 ? (
                    <span className="text-slate-400"> · {sharers.length} people</span>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          <a
            href="#omnoster"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-100/80 transition hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-amber-50/10 hover:text-amber-100"
          >
            View feed →
          </a>
        </div>
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

export function NostrstackOmnoster({
  slug,
  canonicalUrl,
  relays,
}: {
  slug: string;
  canonicalUrl: string;
  relays?: string[];
}) {
  const relayList = useMemo(() => (relays && relays.length > 0 ? relays : DEFAULT_RELAYS), [relays]);
  const { connections, attempted, failed, status, retry } = useRelayConnections(relayList);
  const isRelayMock = relayList.includes('mock');
  const { shares, profiles, loaded, shareCount } = useNostrShareActivity({
    slug,
    canonicalUrl,
    connections,
    status,
    isRelayMock,
  });
  const [expanded, setExpanded] = useState(false);
  const [noteLinks, setNoteLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = shares.map((ev) => ev.id).filter(Boolean) as string[];
    const missing = ids.filter((id) => !noteLinks[id]).slice(0, 24);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const mod = await import('nostr-tools');
        const nip19 = (mod as unknown as { nip19?: { noteEncode?: (id: string) => string } }).nip19;
        if (!nip19?.noteEncode) return;
        const next: Record<string, string> = {};
        for (const id of missing) {
          try {
            const note = nip19.noteEncode(id);
            next[id] = `https://njump.me/${note}`;
          } catch {
            // ignore
          }
        }
        if (!cancelled && Object.keys(next).length > 0) {
          setNoteLinks((prev) => ({ ...prev, ...next }));
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [noteLinks, shares]);

  const visibleShares = expanded ? shares : shares.slice(0, 6);

  return (
    <div id="omnoster" data-testid="nostrstack-omnoster">
      <Section
        title="Omnoster"
        right={
          <span
            key={shareCount}
            className="animate-in fade-in zoom-in-95 duration-300 rounded-full border border-amber-200/30 bg-amber-50/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-100/80"
          >
            {shareCount} share{shareCount === 1 ? '' : 's'}
          </span>
        }
      >
        <p className="text-sm text-slate-300">
          A live feed of Nostr shares for this post.
        </p>

        {status === 'connecting' && !isRelayMock ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-white/10" />
                    <div className="h-2.5 w-24 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : status === 'failed' ? (
          <div className="rounded-2xl border border-rose-200/20 bg-rose-200/5 p-4 text-sm text-rose-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">No relays connected</p>
                <p className="mt-1 text-rose-100/80">
                  Omnoster is unavailable right now. ({failed}/{attempted} relays failed)
                </p>
              </div>
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-rose-200/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-100 transition hover:bg-rose-100/10"
              >
                Retry
              </button>
            </div>
          </div>
        ) : !loaded && !isRelayMock ? (
          <p className="text-sm text-slate-300">Scanning relays…</p>
        ) : shareCount === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            No shares yet. Be the first to spark the thread.
          </div>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-2">
              {visibleShares.map((ev) => {
                const profile = profiles[ev.pubkey];
                const label = getProfileLabel(profile, ev.pubkey);
                const nip05 = profile?.nip05?.trim() || null;
                const eventId = ev.id ?? null;
                const noteUrl = eventId ? noteLinks[eventId] ?? `https://njump.me/${eventId}` : null;

                return (
                  <li
                    key={eventId ?? `${ev.pubkey}-${ev.created_at}`}
                    data-testid="nostrstack-omnoster-item"
                    className="group rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_45px_rgba(12,19,38,0.35)] transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-amber-50/5 hover:shadow-[0_22px_55px_rgba(12,19,38,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar pubkey={ev.pubkey} profile={profile} size={36} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-white">{label}</p>
                          <time className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                            {relativeTimeLabel(ev.created_at)}
                          </time>
                        </div>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.3em] text-slate-500">
                          {nip05 ?? `${ev.pubkey.slice(0, 8)}…`}
                        </p>
                        {noteUrl ? (
                          <a
                            href={noteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 transition hover:text-amber-100"
                          >
                            View note ↗
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {shares.length > 6 ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                data-testid="nostrstack-omnoster-toggle"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-amber-50/10"
              >
                {expanded ? 'Show less' : 'Show all'}
              </button>
            ) : null}
          </div>
        )}
      </Section>
    </div>
  );
}

export function NostrstackComments({ threadId, relays, canonicalUrl }: CommentsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [signerState, setSignerState] = useState<NostrSignerState>({ hasSigner: false });
  const relayList = useMemo(() => (relays && relays.length > 0 ? relays : DEFAULT_RELAYS), [relays]);
  const isMockMode = relayList.includes('mock');
  const { connections, status, retry } = useRelayConnections(relayList);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // detect signer once
    const signer = (globalThis.window === undefined ? null : (globalThis as NostrWindow).nostr);
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
    if (connections.length === 0) return;
    const subs: Array<{ close: () => void }> = [];
    const filters: Array<{ kinds: number[]; '#t': string[] }> = [{ kinds: [1], '#t': [threadId] }];
    for (const relay of connections) {
      const sub = relay.subscribe(filters, {
        onevent: (ev: NostrEvent) => {
          if (ev?.id && seenIds.current.has(ev.id)) return;
          if (ev?.id) seenIds.current.add(ev.id);
          setEvents((prev) => [...prev, ev]);
        },
      });
      subs.push(sub);
    }
    return () => {
      for (const sub of subs) sub.close();
    };
  }, [connections, threadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return;
    const signer = (globalThis as NostrWindow).nostr;
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
    } catch (error_) {
      setError(formatError(error_));
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
      ) : (status === 'failed' ? (
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
      ) : null)}
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
            disabled={posting || (status === 'connecting' && !isMockMode) || (connections.length === 0 && !isMockMode) || !signerState.hasSigner}
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
        {[...events]
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
