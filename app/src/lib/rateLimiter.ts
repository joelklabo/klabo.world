import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { env } from './env';

const redis = createClient({ url: env.REDIS_URL });
redis.on('error', (err) => console.error('[redis] error', err));
redis.connect().catch((err) => {
  console.error('Failed to connect to Redis', err);
});

export const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 10,
  duration: 60,
});
