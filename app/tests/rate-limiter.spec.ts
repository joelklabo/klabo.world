import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRateLimit, rateLimiter } from '../src/lib/rateLimiter';
import { setRateLimitEnv } from './fixtures/rate-limit.env';

const makeRequest = (headers: Record<string, string> = {}) =>
  new Request('https://example.com/upload', { headers });

let restoreEnv: (() => void) | undefined;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (restoreEnv) {
    restoreEnv();
    restoreEnv = undefined;
  }
});

describe('consumeRateLimit', () => {
  it('returns retryAfterSeconds based on limiter response', async () => {
    const consumeSpy = vi
      .spyOn(rateLimiter, 'consume')
      .mockRejectedValue({ msBeforeNext: 1200, remainingPoints: 0, consumedPoints: 10 });

    const forwardedFor = [1, 2, 3, 4].join('.');
    const result = await consumeRateLimit({ request: makeRequest({ 'x-forwarded-for': forwardedFor }) });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 2 });
    expect(consumeSpy).toHaveBeenCalledWith(`admin-upload:${forwardedFor}`, 1);
  });

  it('skips rate limiting when bypass token matches', async () => {
    restoreEnv = setRateLimitEnv({ RATE_LIMIT_BYPASS_TOKEN: 'bypass-me' });

    const consumeSpy = vi.spyOn(rateLimiter, 'consume');
    const forwardedFor = [5, 6, 7, 8].join('.');
    const result = await consumeRateLimit({
      request: makeRequest({ 'x-rate-limit-bypass': 'bypass-me', 'x-forwarded-for': forwardedFor }),
    });

    expect(result).toEqual({ allowed: true });
    expect(consumeSpy).not.toHaveBeenCalled();
  });

  it('falls back to default retryAfterSeconds on unexpected errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(rateLimiter, 'consume').mockRejectedValue(new Error('redis down'));

    const result = await consumeRateLimit({ request: makeRequest() });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('uses session key before client IP', async () => {
    const consumeSpy = vi.spyOn(rateLimiter, 'consume').mockResolvedValue({} as never);

    const forwardedFor = [9, 9, 9, 9].join('.');
    await consumeRateLimit({
      request: makeRequest({ 'x-forwarded-for': forwardedFor }),
      sessionKey: 'admin-user-1',
    });

    expect(consumeSpy).toHaveBeenCalledWith('admin-upload:admin-user-1', 1);
  });

  it('uses unknown key when client IP is missing', async () => {
    const consumeSpy = vi.spyOn(rateLimiter, 'consume').mockResolvedValue({} as never);

    await consumeRateLimit({ request: makeRequest() });

    expect(consumeSpy).toHaveBeenCalledWith('admin-upload:unknown', 1);
  });
});
