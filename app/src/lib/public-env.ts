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
