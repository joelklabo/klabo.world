#!/usr/bin/env node
import process from 'node:process';

function parseArgs(argv) {
  const out = { text: '', url: '', relays: '' };
  const textIdx = argv.indexOf('--text');
  const urlIdx = argv.indexOf('--url');
  const relaysIdx = argv.indexOf('--relays');
  if (textIdx !== -1) out.text = argv[textIdx + 1] ?? '';
  if (urlIdx !== -1) out.url = argv[urlIdx + 1] ?? '';
  if (relaysIdx !== -1) out.relays = argv[relaysIdx + 1] ?? '';
  return out;
}

const { text, url, relays } = parseArgs(process.argv.slice(2));
if (!text) {
  console.error('Missing --text');
  process.exit(2);
}

const nsec = process.env.NOSTR_NSEC;
if (!nsec) {
  console.error('Missing NOSTR_NSEC env var');
  process.exit(2);
}

const mod = await import('nostr-tools');
const poolMod = await import('nostr-tools/pool');

const { finalizeEvent, nip19 } = mod;
const { SimplePool } = poolMod;

let secretKey;
if (nsec.startsWith('nsec')) {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') throw new Error('Invalid nsec');
  secretKey = decoded.data;
} else {
  // hex
  secretKey = Uint8Array.from(Buffer.from(nsec, 'hex'));
}

const content = url ? `${text}\n\n${url}` : text;

const event = finalizeEvent(
  {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: url ? [['r', url]] : [],
    content,
  },
  secretKey,
);

const relayList = (relays || process.env.NOSTR_RELAYS || 'wss://relay.damus.io,wss://relay.snort.social')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const pool = new SimplePool();
try {
  const pubs = await Promise.allSettled(pool.publish(relayList, event));
  const ok = pubs.some((p) => p.status === 'fulfilled');
  if (!ok) {
    console.error('Failed to publish to any relay');
    process.exit(1);
  }
} finally {
  pool.close(relayList);
}

console.log(JSON.stringify({ id: event.id, url: `nostr:${nip19.neventEncode({ id: event.id })}` }));
