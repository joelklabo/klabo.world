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

const disableSqliteOverrides = () => {
  process.env.CI = 'false';
  process.env.ALLOW_SQLITE_IN_PROD = 'false';
};

describe('loadEnv production guardrails', () => {
  it('throws when DATABASE_URL uses SQLite in production', () => {
    disableSqliteOverrides();
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
      } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL uses SQLite/i);
  });

  it('allows SQLite in production when explicitly overridden', () => {
    process.env.CI = 'false';
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
        ALLOW_SQLITE_IN_PROD: 'true',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('allows SQLite in production on Azure App Service without override', () => {
    disableSqliteOverrides();
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
        WEBSITE_SITE_NAME: 'klabo-world-app',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('still throws on Azure when SQLite is explicitly disabled', () => {
    disableSqliteOverrides();
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        DATABASE_URL: 'file:../data/app.db',
        WEBSITE_SITE_NAME: 'klabo-world-app',
        ALLOW_SQLITE_IN_PROD: 'false',
      } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL uses SQLite/i);
  });

  it('throws when NEXTAUTH_SECRET is the dev default', () => {
    disableSqliteOverrides();
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        NEXTAUTH_SECRET: 'dev-secret',
      } as NodeJS.ProcessEnv),
    ).toThrow(/NEXTAUTH_SECRET/i);
  });

  it('requires Azure storage when durable uploads are enforced', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        UPLOADS_REQUIRE_DURABLE: 'true',
      } as NodeJS.ProcessEnv),
    ).toThrow(/AZURE_STORAGE_ACCOUNT/i);
  });

  it('passes when durable uploads are enabled with Azure credentials', () => {
    expect(() =>
      loadEnv({
        ...baseProdEnv,
        UPLOADS_REQUIRE_DURABLE: 'true',
        AZURE_STORAGE_ACCOUNT: 'account',
        AZURE_STORAGE_KEY: 'key',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});
