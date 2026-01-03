import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const shouldEnforceServerOnly = process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true';
if (shouldEnforceServerOnly) {
  require('server-only');
}

const FALLBACK_SITE_URL = 'https://klabo.world';
const FALLBACK_GITHUB_OWNER = 'joelklabo';

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_SITE_URL;
  try {
    return new URL(trimmed).toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function normalizeString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || fallback;
}

export function getPublicSiteUrl(): string {
  const raw = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL;
  return normalizeUrl(raw);
}

export function getPublicGitHubOwner(): string {
  const raw = process.env.GITHUB_OWNER ?? process.env.NEXT_PUBLIC_GITHUB_OWNER ?? FALLBACK_GITHUB_OWNER;
  return normalizeString(raw, FALLBACK_GITHUB_OWNER);
}

export function getPublicGitHubToken(): string | undefined {
  const token = process.env.GITHUB_TOKEN?.trim() ?? '';
  return token || undefined;
}

export function getPublicNostrstackConfig() {
  const baseUrl = process.env.NOSTRSTACK_BASE_URL ?? process.env.NEXT_PUBLIC_NOSTRSTACK_BASE_URL;
  const host = process.env.NOSTRSTACK_HOST ?? process.env.NEXT_PUBLIC_NOSTRSTACK_HOST;
  const lightningAddress = process.env.NOSTRSTACK_LN_ADDRESS ?? process.env.NEXT_PUBLIC_NOSTRSTACK_LN_ADDRESS;
  const nostrPubkey = process.env.NOSTRSTACK_NOSTR_PUBKEY ?? process.env.NEXT_PUBLIC_NOSTRSTACK_PUBKEY;
  const relays = process.env.NOSTRSTACK_RELAYS ?? process.env.NEXT_PUBLIC_NOSTRSTACK_RELAYS;

  return {
    baseUrl: baseUrl?.trim() || undefined,
    host: host?.trim() || undefined,
    lightningAddress: lightningAddress?.trim() || undefined,
    nostrPubkey: nostrPubkey?.trim() || undefined,
    relays: relays?.trim() || undefined,
  };
}
