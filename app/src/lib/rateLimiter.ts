import { createRateLimiter } from '@klaboworld/core';
import { env } from './env';

export const rateLimiter = createRateLimiter({
  redisUrl: env.REDIS_URL,
  points: 10,
  durationSeconds: 60,
});
