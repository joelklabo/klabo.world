import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { env } from './env';

let limiter: RateLimiterRedis | RateLimiterMemory;

if (env.REDIS_URL) {
  const redis = createClient({ url: env.REDIS_URL });
  redis.on('error', (err) => console.error('[redis] error', err));
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis', err);
  });
  limiter = new RateLimiterRedis({
    storeClient: redis,
    points: 10,
    duration: 60,
  });
} else {
  limiter = new RateLimiterMemory({
    points: 10,
    duration: 60,
  });
}

export const rateLimiter = limiter;
