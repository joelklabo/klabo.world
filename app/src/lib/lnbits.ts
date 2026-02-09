import { env } from './env';

export function getLnbitsBaseUrl(): string {
  const base = env.LNBITS_BASE_URL?.trim();
  if (!base) throw new Error('LNBITS_BASE_URL is not configured');
  return base.replace(/\/$/, '');
}

export function buildLnbitsHeaders(): Record<string, string> {
  return { Accept: 'application/json' };
}

export function getLnbitsAdminKey(): string | null {
  return env.LNBITS_ADMIN_KEY?.trim() || null;
}
