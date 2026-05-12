import { createRequire } from 'node:module';
import { DEFAULT_GITHUB_OWNER, SITE_CANONICAL_URL } from '@/lib/site-config';

const require = createRequire(import.meta.url);
const shouldEnforceServerOnly = process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true';
if (shouldEnforceServerOnly) {
  require('server-only');
}

const FALLBACK_SITE_URL = SITE_CANONICAL_URL;

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

export function getPublicSiteOriginUrl(): string {
  const site = new URL(getPublicSiteUrl());
  site.pathname = '';
  site.search = '';
  site.hash = '';
  return site.toString().replace(/\/$/, '');
}

export function withPublicSiteUrl(path: string): string {
  const base = getPublicSiteUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getPublicGitHubOwner(): string {
  const raw = process.env.GITHUB_OWNER ?? process.env.NEXT_PUBLIC_GITHUB_OWNER ?? DEFAULT_GITHUB_OWNER;
  return normalizeString(raw, DEFAULT_GITHUB_OWNER);
}

export function getPublicGitHubToken(): string | undefined {
  const token = process.env.GITHUB_TOKEN?.trim() ?? '';
  return token || undefined;
}
