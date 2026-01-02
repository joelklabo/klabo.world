import { createRateLimiter } from '@klaboworld/core/server/rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { env } from './env';
import { incrementCounter } from './telemetry';

const RATE_LIMIT_SCOPE = 'admin-upload';
const RATE_LIMIT_POINTS = 10;
const RATE_LIMIT_DURATION_SECONDS = 60;
const RATE_LIMIT_BYPASS_HEADER = 'x-rate-limit-bypass';
const DEFAULT_RETRY_AFTER_SECONDS = 60;
const RATE_LIMIT_DECISION_METRIC = 'rate_limit_decision_total';
const RATE_LIMIT_FALLBACK_METRIC = 'rate_limit_fallback_total';

const redisFailureMode =
  process.env.RATE_LIMIT_REDIS_FAILURE_MODE?.toLowerCase() === 'fail-closed' ? 'fail-closed' : 'memory';

export const rateLimiter = createRateLimiter({
  redisUrl: env.REDIS_URL,
  points: RATE_LIMIT_POINTS,
  durationSeconds: RATE_LIMIT_DURATION_SECONDS,
  redisFailureMode,
  onRedisFallback: (context, error) => {
    incrementCounter(RATE_LIMIT_FALLBACK_METRIC, 1, {
      scope: RATE_LIMIT_SCOPE,
      mode: redisFailureMode,
      context,
    });
    if (error) {
      console.warn('[rateLimiter] redis fallback signal', { context });
    }
  },
});

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function getForwardedForIp(forwarded: string, trustedProxyHops: number): string | null {
  const addresses = forwarded
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  if (addresses.length === 0) {
    return null;
  }
  if (trustedProxyHops <= 0) {
    return null;
  }
  if (addresses.length <= trustedProxyHops) {
    return addresses[0] ?? null;
  }
  const index = Math.max(0, addresses.length - trustedProxyHops - 1);
  return addresses[index] ?? null;
}

function getTrustedProxyHops(): number {
  const parsed = Number.parseInt(process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS ?? '0', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getClientIp(request: Request): string | null {
  const trustedProxyHops = getTrustedProxyHops();
  if (trustedProxyHops <= 0) {
    return null;
  }
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = getForwardedForIp(forwarded, trustedProxyHops);
    if (ip) {
      return ip;
    }
  }
  const realIp = request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip');
  return realIp?.trim() || null;
}

function isRateLimitBypassed({
  request,
  sessionKey,
  scope,
}: {
  request: Request;
  sessionKey?: string | null;
  scope: string;
}): boolean {
  const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN?.trim();
  if (!bypassToken) {
    return false;
  }
  const identity = sessionKey?.trim();
  if (!identity) {
    return false;
  }
  const header = request.headers.get(RATE_LIMIT_BYPASS_HEADER);
  if (!(typeof header === 'string' && header.trim() === bypassToken)) {
    return false;
  }
  const clientIp = getClientIp(request) ?? 'unknown';
  console.warn('[rateLimiter] bypass used', { scope, sessionKey: identity, ip: clientIp });
  return true;
}

function buildRateLimitKey({
  request,
  sessionKey,
  scope,
}: {
  request: Request;
  sessionKey?: string | null;
  scope: string;
}): string {
  const identity = sessionKey?.trim() || getClientIp(request) || 'unknown';
  return `${scope}:${identity}`;
}

function isRateLimiterRes(value: unknown): value is RateLimiterRes {
  if (value instanceof RateLimiterRes) {
    return true;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'msBeforeNext' in value && 'remainingPoints' in value && 'consumedPoints' in value;
}

export async function consumeRateLimit({
  request,
  sessionKey,
  points = 1,
  scope = RATE_LIMIT_SCOPE,
}: {
  request: Request;
  sessionKey?: string | null;
  points?: number;
  scope?: string;
}): Promise<RateLimitResult> {
  if (isRateLimitBypassed({ request, sessionKey, scope })) {
    incrementCounter(RATE_LIMIT_DECISION_METRIC, 1, { status: 'bypassed', scope });
    return { allowed: true };
  }

  const key = buildRateLimitKey({ request, sessionKey, scope });
  try {
    await rateLimiter.consume(key, points);
    incrementCounter(RATE_LIMIT_DECISION_METRIC, 1, { status: 'allowed', scope });
    return { allowed: true };
  } catch (error) {
    if (isRateLimiterRes(error)) {
      const retryAfterSeconds = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
      incrementCounter(RATE_LIMIT_DECISION_METRIC, 1, { status: 'blocked', scope });
      return { allowed: false, retryAfterSeconds };
    }
    console.error('[rateLimiter] consume failed', error);
    incrementCounter(RATE_LIMIT_DECISION_METRIC, 1, { status: 'error', scope });
    return { allowed: false, retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS };
  }
}
