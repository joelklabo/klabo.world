import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://klaboworld:klaboworld@localhost:5432/klaboworld'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  UPLOADS_CONTAINER_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().default('dev-secret'),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().default('joelklabo'),
  GITHUB_REPO: z.string().default('KlaboWorld'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('ENV validation failed');
}

export const env = parsed.data;
