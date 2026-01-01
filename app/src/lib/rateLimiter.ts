import { createRateLimiter } from '@klaboworld/core/server/rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { env } from './env';

const RATE_LIMIT_SCOPE = 'admin-upload';
const RATE_LIMIT_POINTS = 10;
const RATE_LIMIT_DURATION_SECONDS = 60;
const RATE_LIMIT_BYPASS_HEADER = 'x-rate-limit-bypass';
const DEFAULT_RETRY_AFTER_SECONDS = 60;

const redisFailureMode =
  process.env.RATE_LIMIT_REDIS_FAILURE_MODE?.toLowerCase() === 'fail-closed' ? 'fail-closed' : 'memory';

export const rateLimiter = createRateLimiter({
  redisUrl: env.REDIS_URL,
  points: RATE_LIMIT_POINTS,
  durationSeconds: RATE_LIMIT_DURATION_SECONDS,
  redisFailureMode,
});

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip');
  return realIp?.trim() || null;
}

function isRateLimitBypassed(request: Request): boolean {
  const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN?.trim();
  if (!bypassToken) {
    return false;
  }
  const header = request.headers.get(RATE_LIMIT_BYPASS_HEADER);
  return typeof header === 'string' && header.trim() === bypassToken;
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
  if (isRateLimitBypassed(request)) {
    return { allowed: true };
  }

  const key = buildRateLimitKey({ request, sessionKey, scope });
  try {
    await rateLimiter.consume(key, points);
    return { allowed: true };
  } catch (error) {
    if (isRateLimiterRes(error)) {
      const retryAfterSeconds = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    console.error('[rateLimiter] consume failed', error);
    return { allowed: false, retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS };
  }
}
