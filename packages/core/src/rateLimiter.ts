import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { createClient } from 'redis';

export type RateLimiter = {
  consume: (key: string | number, points?: number) => Promise<RateLimiterRes>;
};

export type RedisFailureMode = 'memory' | 'fail-closed';

export interface RateLimiterConfig {
  redisUrl?: string;
  points?: number;
  durationSeconds?: number;
  redisFailureMode?: RedisFailureMode;
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const points = config.points ?? 10;
  const duration = config.durationSeconds ?? 60;
  const failureMode = config.redisFailureMode ?? 'memory';
  const memoryLimiter = new RateLimiterMemory({ points, duration });

  if (config.redisUrl) {
    const redis = createClient({ url: config.redisUrl });
    let redisReady = false;
    let fallbackLogged = false;

    const markUnavailable = (context: string, error?: unknown) => {
      redisReady = false;
      if (failureMode === 'memory' && !fallbackLogged) {
        console.warn(`[rateLimiter] Redis unavailable (${context}); using memory fallback.`, error);
        fallbackLogged = true;
      }
    };

    redis.on('ready', () => {
      redisReady = true;
      fallbackLogged = false;
    });
    redis.on('end', () => markUnavailable('end'));
    redis.on('error', (err) => {
      console.error('[redis] error', err);
      markUnavailable('error', err);
    });
    redis.connect().catch((err) => {
      console.error('Failed to connect to Redis', err);
      markUnavailable('connect', err);
    });

    const redisLimiter = new RateLimiterRedis({ storeClient: redis, points, duration });
    return {
      async consume(key: string | number, pointsToConsume?: number) {
        if (!redisReady && failureMode === 'memory') {
          return memoryLimiter.consume(key, pointsToConsume);
        }
        try {
          return await redisLimiter.consume(key, pointsToConsume);
        } catch (error) {
          if (isRateLimiterRes(error)) {
            throw error;
          }
          if (failureMode === 'memory') {
            markUnavailable('consume', error);
            return memoryLimiter.consume(key, pointsToConsume);
          }
          throw error;
        }
      },
    };
  }

  return memoryLimiter;
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
