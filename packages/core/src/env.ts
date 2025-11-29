import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().url().optional(),
);

const schema = z.object({
  DATABASE_URL: z.string().default('file:../data/app.db'),
  REDIS_URL: optionalUrl,
  FEATURE_FLAGS_JSON: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  UPLOADS_CONTAINER_URL: optionalUrl,
  UPLOADS_DIR: z.string().default('public/uploads'),
  NEXTAUTH_SECRET: z.string().default('dev-secret'),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().default('joelklabo'),
  GITHUB_REPO: z.string().default('KlaboWorld'),
  SITE_URL: z.string().url().default('https://klabo.world'),
  NEXTAUTH_URL: z.string().url().default('https://klabo.world'),
  LOG_ANALYTICS_WORKSPACE_ID: z.string().optional(),
  LOG_ANALYTICS_SHARED_KEY: z.string().optional(),
  NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('ENV validation failed');
  }

  const data = parsed.data;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && !(key in process.env)) {
      process.env[key] = value;
    }
  }
  return data;
}
