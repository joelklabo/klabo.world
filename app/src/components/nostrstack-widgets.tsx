'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { relayInit, type Relay, type Sub } from 'nostr-tools';

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

async function connectRelays(urls: string[]): Promise<Relay[]> {
  const results: Relay[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const relay = relayInit(url);
        await relay.connect();
        results.push(relay);
      } catch (error) {
        console.warn('relay connect failed', url, error);
      }
    }),
  );
  return results;
}

function useRelayConnections(relays: string[]) {
  const [connections, setConnections] = useState<Relay[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let closed = false;
    let active: Relay[] = [];
    (async () => {
      const next = await connectRelays(relays);
      if (closed) {
        next.forEach((relay) => relay.close());
        return;
      }
      active = next;
      setConnections(next);
      setReady(true);
    })();

    return () => {
      closed = true;
      active.forEach((relay) => relay.close());
    };
  }, [relays.join('|')]);

  return { connections, ready } as const;
}

async function publishToRelays(relays: Relay[], event: NostrEvent) {
  await Promise.all(
    relays.map(
      (relay) =>
        new Promise<void>((resolve, reject) => {
          const pub = relay.publish(event as any);
          const timer = setTimeout(() => reject(new Error('publish timeout')), 7000);
          pub.on('ok', () => {
            clearTimeout(timer);
            resolve();
          });
          pub.on('failed', (reason: string) => {
            clearTimeout(timer);
            reject(new Error(reason || 'publish failed'));
          });
        }),
    ),
  );
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
  summary,
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
  const [shareState, setShareState] = useState<'idle' | 'posting' | 'copied' | 'error'>('idle');
  const [shareError, setShareError] = useState<string | null>(null);
  const relayList = useMemo(() => (relays && relays.length ? relays : DEFAULT_RELAYS), [relays]);
  const { connections, ready } = useRelayConnections(relayList);
  const lightning = useMemo(() => parseLightningAddress(lightningAddress ?? undefined), [lightningAddress]);
  const copyInvoice = useCallback(() => copyText(invoice), [invoice]);

  const handleTip = useCallback(async () => {
    if (!lightning) {
      setTipError('Lightning address missing');
      setTipState('error');
      return;
    }
    setTipState('loading');
    setTipError(null);
    try {
      const client = new NostrstackClient({ baseUrl, host: host ?? lightning.domain });
      const meta = await client.metadata(lightning.username);
      const amount = Math.max(meta?.minSendable ?? MIN_MSAT, MIN_MSAT);
      const { pr, payment_request } = await client.invoice(lightning.username, amount);
      const paymentRequest = pr ?? payment_request;
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
  }, [lightning, baseUrl, host, copyInvoice]);

  const handleShare = useCallback(async () => {
    const note = `${title}\n${canonicalUrl}${lightningAddress ? `\n⚡️ ${lightningAddress}` : ''}`;
    setShareError(null);

    // Prefer Nostr share when signer is available
    if (typeof window !== 'undefined' && (window as any).nostr && connections.length) {
      setShareState('posting');
      try {
        const pubkey = await (window as any).nostr.getPublicKey();
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
        const signed = await (window as any).nostr.signEvent(unsigned);
        await publishToRelays(connections, signed);
        setShareState('copied');
        await copyText(note);
        return;
      } catch (error) {
        setShareError(formatError(error));
        setShareState('error');
        return;
      }
    }

    // Fallback: copy/share without nostr signer
    try {
      if (navigator?.share) {
        await navigator.share({ title, text: note, url: canonicalUrl });
        setShareState('copied');
        return;
      }
      await copyText(note);
      setShareState('copied');
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
          onClick={handleTip}
          disabled={!lightning || !baseUrl || tipState === 'loading'}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200/50"
        >
          {tipState === 'loading' ? 'Generating…' : lightning ? 'Send sats' : 'Lightning missing'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={shareState === 'posting'}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-200/70 hover:text-amber-100 disabled:cursor-wait"
        >
          {shareState === 'posting' ? 'Posting…' : 'Share to Nostr'}
        </button>
        {ready ? (
          <span className="text-xs uppercase tracking-[0.25em] text-amber-100/80">Relays ready</span>
        ) : (
          <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Connecting relays…</span>
        )}
      </div>
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
      {shareError && <p className="text-sm text-rose-200">{shareError}</p>}
    </Section>
  );
}

export function NostrstackComments({ threadId, relays, canonicalUrl }: CommentsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const relayList = useMemo(() => (relays && relays.length ? relays : DEFAULT_RELAYS), [relays]);
  const { connections, ready } = useRelayConnections(relayList);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!connections.length) return;
    const subs: Sub[] = [];
    const filters = [{ kinds: [1], '#t': [threadId] }];
    connections.forEach((relay) => {
      const sub = relay.sub(filters as any);
      sub.on('event', (ev: NostrEvent) => {
        if (ev?.id && seenIds.current.has(ev.id)) return;
        if (ev?.id) seenIds.current.add(ev.id);
        setEvents((prev) => [...prev, ev]);
      });
      subs.push(sub);
    });
    return () => {
      subs.forEach((sub) => sub.unsub());
    };
  }, [connections, threadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return;
    if (!(window as any).nostr) {
      setError('Nostr signer (NIP-07) required to post.');
      return;
    }
    try {
      setPosting(true);
      const pubkey = await (window as any).nostr.getPublicKey();
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
      const signed = await (window as any).nostr.signEvent(unsigned);
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
      {!ready && <p className="text-sm text-slate-400">Connecting to relays…</p>}
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
            disabled={posting || !connections.length}
            className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post comment'}
          </button>
          <span>{events.length} note{events.length === 1 ? '' : 's'}</span>
        </div>
      </form>
      {error && <p className="text-sm text-rose-200">{error}</p>}
      <div className="space-y-3">
        {events.length === 0 && ready && <p className="text-sm text-slate-300">No comments yet.</p>}
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
