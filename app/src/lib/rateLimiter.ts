import { createRateLimiter } from '@klaboworld/core/server/rateLimiter';
import { env } from './env';

export const rateLimiter = createRateLimiter({
  redisUrl: env.REDIS_URL,
  points: 10,
  durationSeconds: 60,
});
