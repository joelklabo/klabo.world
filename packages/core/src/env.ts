import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.union([z.string().url(), z.literal('mock')]).optional(),
);

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'y', 'on']);
const FALSY_VALUES = new Set(['0', 'false', 'no', 'n', 'off']);

const coerceBooleanFlag = (value: unknown): boolean | undefined => {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') {
      return false;
    }
    if (TRUTHY_VALUES.has(normalized)) {
      return true;
    }
    if (FALSY_VALUES.has(normalized)) {
      return false;
    }
  }
  return undefined;
};

const booleanFlag = (label: string) =>
  z.preprocess((value) => {
    const parsed = coerceBooleanFlag(value);
    if (parsed !== undefined) {
      return parsed;
    }
    return value;
  }, z.boolean({ message: `${label} must be true or false` }).default(false));

const readBooleanEnv = (value: string | undefined) => coerceBooleanFlag(value) ?? false;

const schema = z.object({
  DATABASE_URL: z.string().default('file:../data/app.db'),
  REDIS_URL: optionalUrl,
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  UPLOADS_CONTAINER_URL: optionalUrl,
  UPLOADS_DIR: z.string().default('public/uploads'),
  UPLOADS_QUARANTINE_DIR: z.string().optional(),
  AZURE_STORAGE_ACCOUNT: z.string().optional(),
  AZURE_STORAGE_KEY: z.string().optional(),
  AZURE_STORAGE_CONTAINER: z.string().optional(),
  UPLOADS_QUARANTINE_CONTAINER: z.string().optional(),
  ALLOW_SQLITE_IN_PROD: booleanFlag('ALLOW_SQLITE_IN_PROD'),
  UPLOADS_REQUIRE_DURABLE: booleanFlag('UPLOADS_REQUIRE_DURABLE'),
  UPLOADS_SCAN_FAIL_OPEN: booleanFlag('UPLOADS_SCAN_FAIL_OPEN'),
  NEXTAUTH_SECRET: z.string().default('dev-secret'),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().default('joelklabo'),
  GITHUB_REPO: z.string().default('KlaboWorld'),
  SITE_URL: z.string().url().default('https://klabo.world'),
  NEXTAUTH_URL: z.string().url().default('https://klabo.world'),
  LOG_ANALYTICS_WORKSPACE_ID: z.string().optional(),
  LOG_ANALYTICS_SHARED_KEY: z.string().optional(),
  APPINSIGHTS_APP_ID: z.string().optional(),
  APPINSIGHTS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  NOSTRSTACK_BASE_URL: optionalUrl,
  NOSTRSTACK_HOST: z.string().optional(),
  NOSTRSTACK_LN_ADDRESS: z.string().optional(),
  NOSTRSTACK_NOSTR_PUBKEY: z.string().optional(),
  NOSTRSTACK_RELAYS: z.string().optional(),
  NEXT_PUBLIC_NOSTRSTACK_BASE_URL: optionalUrl,
  NEXT_PUBLIC_NOSTRSTACK_HOST: z.string().optional(),
  NEXT_PUBLIC_NOSTRSTACK_RELAYS: z.string().optional(),
  NEXT_PUBLIC_NOSTRSTACK_PUBKEY: z.string().optional(),
  NEXT_PUBLIC_NOSTRSTACK_LN_ADDRESS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function isBlank(value?: string | null) {
  return !value || value.trim() === '';
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('ENV validation failed');
  }

  const data = parsed.data;
  const nodeEnv = typeof source.NODE_ENV === 'string' ? source.NODE_ENV : process.env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    const databaseUrl = data.DATABASE_URL.trim();
    const isCiEnv = readBooleanEnv(process.env.CI);
    const azureSiteName = typeof source.WEBSITE_SITE_NAME === 'string' ? source.WEBSITE_SITE_NAME.trim() : '';
    const azureInstanceId = typeof source.WEBSITE_INSTANCE_ID === 'string' ? source.WEBSITE_INSTANCE_ID.trim() : '';
    const isAzureAppService = Boolean(azureSiteName || azureInstanceId);
    const rawAllowSqlite = typeof source.ALLOW_SQLITE_IN_PROD === 'string' ? source.ALLOW_SQLITE_IN_PROD.trim().toLowerCase() : '';
    const hasExplicitSqliteOverride = rawAllowSqlite !== '';
    const explicitlyDisabledSqlite = hasExplicitSqliteOverride && FALSY_VALUES.has(rawAllowSqlite);
    const allowSqliteInProd =
      data.ALLOW_SQLITE_IN_PROD ||
      readBooleanEnv(process.env.ALLOW_SQLITE_IN_PROD) ||
      isCiEnv;
    if (databaseUrl.startsWith('file:') && !allowSqliteInProd) {
      if (isAzureAppService && !explicitlyDisabledSqlite) {
        console.warn(
          'ALLOW_SQLITE_IN_PROD not set; allowing SQLite in production on Azure App Service. Set ALLOW_SQLITE_IN_PROD=true to suppress this warning.',
        );
      } else {
        throw new Error('Unsafe production configuration: DATABASE_URL uses SQLite. Set ALLOW_SQLITE_IN_PROD=true to override.');
      }
    }
    if (data.NEXTAUTH_SECRET.trim() === 'dev-secret' && !isCiEnv) {
      throw new Error('Unsafe production configuration: NEXTAUTH_SECRET is set to the dev default.');
    }
    if (data.UPLOADS_REQUIRE_DURABLE) {
      if (isBlank(data.AZURE_STORAGE_ACCOUNT) || isBlank(data.AZURE_STORAGE_KEY)) {
        throw new Error('Durable uploads require AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY to be set.');
      }
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && !(key in process.env)) {
      process.env[key] = value;
    }
  }
  return data;
}
