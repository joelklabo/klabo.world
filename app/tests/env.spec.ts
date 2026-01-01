import { afterEach, describe, expect, it } from 'vitest';
import { loadEnv } from '@klaboworld/core';

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

const baseProdEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://example.local/db',
  NEXTAUTH_SECRET: 'super-secret',
};

describe('loadEnv production guardrails', () => {
  it('throws when DATABASE_URL uses SQLite in production', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
      }),
    ).toThrow(/DATABASE_URL uses SQLite/i);
  });

  it('allows SQLite in production when explicitly overridden', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
        ALLOW_SQLITE_IN_PROD: 'true',
      }),
    ).not.toThrow();
  });

  it('throws when NEXTAUTH_SECRET is the dev default', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        NEXTAUTH_SECRET: 'dev-secret',
      }),
    ).toThrow(/NEXTAUTH_SECRET/i);
  });

  it('requires Azure storage when durable uploads are enforced', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        UPLOADS_REQUIRE_DURABLE: 'true',
      }),
    ).toThrow(/AZURE_STORAGE_ACCOUNT/i);
  });

  it('passes when durable uploads are enabled with Azure credentials', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        UPLOADS_REQUIRE_DURABLE: 'true',
        AZURE_STORAGE_ACCOUNT: 'account',
        AZURE_STORAGE_KEY: 'key',
      }),
    ).not.toThrow();
  });
});
