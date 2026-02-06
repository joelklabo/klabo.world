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
          className="-ml-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:translate-x-[var(--dx)]"
        >
          <Avatar pubkey={pubkey} profile={profiles[pubkey]} size={size} className="ring-2 ring-[#0d1428]" />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className="-ml-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:translate-x-[var(--dx)]"
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
    const signer = (globalThis.window === undefined ? null : (globalThis as unknown as NostrWindow).nostr);
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
    const signer = (globalThis as unknown as NostrWindow).nostr;
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
            className="min-h-8 rounded-full border border-rose-200/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-100 transition-colors hover:bg-rose-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
          >
            Retry
          </button>
        </div>
      ) : null)}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          id="nostr-comment"
          name="nostr-comment"
          aria-label="Add a comment via Nostr"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Add a comment via Nostr"
          className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base sm:text-sm text-white placeholder:text-slate-400 focus:border-amber-200/60 focus:outline-none focus:ring-2 focus:ring-amber-200/30"
        />
        <div className="flex items-center justify-between text-sm text-slate-400">
          <button
            type="submit"
            disabled={posting || (status === 'connecting' && !isMockMode) || (connections.length === 0 && !isMockMode) || !signerState.hasSigner}
            data-testid="nostrstack-comment-submit"
            className="min-h-10 rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
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
