export type RateLimitEnv = {
  RATE_LIMIT_BYPASS_TOKEN?: string;
  RATE_LIMIT_REDIS_FAILURE_MODE?: string;
};

export function setRateLimitEnv(env: RateLimitEnv) {
  const previous: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}
