import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';

export type RateLimiter = RateLimiterRedis | RateLimiterMemory;

export interface RateLimiterConfig {
  redisUrl?: string;
  points?: number;
  durationSeconds?: number;
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const points = config.points ?? 10;
  const duration = config.durationSeconds ?? 60;

  if (config.redisUrl) {
    const redis = createClient({ url: config.redisUrl });
    redis.on('error', (err) => console.error('[redis] error', err));
    redis.connect().catch((err) => {
      console.error('Failed to connect to Redis', err);
    });
    return new RateLimiterRedis({ storeClient: redis, points, duration });
  }

  return new RateLimiterMemory({ points, duration });
}
