#!/usr/bin/env node
/**
 * Smoke-test publishing to Nostr relays with two generated keypairs.
 *
 * Usage:
 *   node app/scripts/nostr-share-smoke.mjs
 *
 * Optional env:
 *   NOSTR_RELAYS="wss://relay.damus.io,wss://relay.snort.social"
 *   NOSTR_CANONICAL_URL="https://klabo.world/posts/agentically-engineering-past-procrastination"
 */

import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';

const canonicalUrl =
  process.env.NOSTR_CANONICAL_URL ??
  'https://klabo.world/posts/agentically-engineering-past-procrastination';

const relaysRaw = process.env.NOSTR_RELAYS ?? 'wss://relay.damus.io,wss://relay.snort.social';
const relays = relaysRaw
  .split(/[,\n]/)
  .map((entry) => entry.trim())
  .filter(Boolean);

if (!relays.length) {
  console.error('No relays provided via NOSTR_RELAYS');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const tag = 'klabo-world-share-smoke';

const secretA = generateSecretKey();
const pubA = getPublicKey(secretA);
const secretB = generateSecretKey();
const pubB = getPublicKey(secretB);

const pool = new SimplePool({ enablePing: true, enableReconnect: true });

async function publish(event) {
  const results = await Promise.allSettled(pool.publish(relays, event));
  const ok = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');
  return { ok: ok.length, failed: failed.length, results };
}

async function getById(id) {
  return pool.get(relays, { ids: [id] }, { maxWait: 8000 });
}

try {
  const noteA = finalizeEvent(
    {
      kind: 1,
      created_at: now,
      tags: [
        ['t', tag],
        ['r', canonicalUrl],
      ],
      content: `klabo.world share smoke test (A)\n${canonicalUrl}\n${new Date().toISOString()}`,
    },
    secretA,
  );

  const publishedA = await publish(noteA);
  console.log(`A pubkey: ${pubA}`);
  console.log(`B pubkey: ${pubB}`);
  console.log(`Relays: ${relays.join(', ')}`);
  console.log(`Published A: ok=${publishedA.ok} failed=${publishedA.failed} id=${noteA.id}`);

  if (publishedA.ok === 0) {
    console.error('Failed to publish note A to any relay.');
    process.exit(1);
  }

  const fetchedA = await getById(noteA.id);
  if (!fetchedA) {
    console.error('Unable to fetch note A back from relays.');
    process.exit(1);
  }
  console.log(`Fetched A: ${fetchedA.id} (pubkey=${fetchedA.pubkey})`);

  const replyB = finalizeEvent(
    {
      kind: 1,
      created_at: now + 1,
      tags: [
        ['t', tag],
        ['e', noteA.id],
        ['p', pubA],
        ['r', canonicalUrl],
      ],
      content: `klabo.world share smoke test reply (B)\n${canonicalUrl}\n${new Date().toISOString()}`,
    },
    secretB,
  );

  const publishedB = await publish(replyB);
  console.log(`Published B: ok=${publishedB.ok} failed=${publishedB.failed} id=${replyB.id}`);
  if (publishedB.ok === 0) {
    console.error('Failed to publish reply B to any relay.');
    process.exit(1);
  }

  const fetchedB = await getById(replyB.id);
  if (!fetchedB) {
    console.error('Unable to fetch reply B back from relays.');
    process.exit(1);
  }
  console.log(`Fetched B: ${fetchedB.id} (pubkey=${fetchedB.pubkey})`);
} finally {
  pool.destroy();
}

