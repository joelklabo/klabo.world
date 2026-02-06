import { env } from './env';

export function getLnbitsBaseUrl(): string {
  const base = env.LNBITS_BASE_URL?.trim();
  if (!base) throw new Error('LNBITS_BASE_URL is not configured');
  return base.replace(/\/$/, '');
}

export function buildLnbitsHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const auth = env.LNBITS_BASIC_AUTH?.trim();
  if (auth) {
    const token = Buffer.from(auth, 'utf8').toString('base64');
    headers.Authorization = `Basic ${token}`;
  }
  return headers;
}

export function getLnbitsAdminKey(): string | null {
  return env.LNBITS_ADMIN_KEY?.trim() || null;
}
