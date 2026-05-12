import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NEXTAUTH_SECRET, DEFAULT_DATABASE_URL } from '@/lib/site-config';

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function setStrictProdEnv() {
  const env = process.env as Record<string, string>;
  env.NODE_ENV = 'production';
  env.CI = 'false';
  env.NEXTAUTH_SECRET = DEFAULT_NEXTAUTH_SECRET;
  env.DATABASE_URL = DEFAULT_DATABASE_URL;
  env.VITEST = 'true';
}

afterEach(() => {
  resetEnv();
  vi.resetModules();
});

describe('public routes avoid loadEnv guardrails', () => {
  it('imports public modules without invoking loadEnv', async () => {
    setStrictProdEnv();
    vi.resetModules();

    await expect(import('@/app/robots')).resolves.toBeDefined();
    await expect(import('@/app/sitemap')).resolves.toBeDefined();
    await expect(import('@/app/og.png/route')).resolves.toBeDefined();
    await expect(import('@/lib/feed')).resolves.toBeDefined();
    await expect(import('@/lib/github-projects')).resolves.toBeDefined();
    await expect(import('@/app/page')).resolves.toBeDefined();
    await expect(import('@/app/projects/page')).resolves.toBeDefined();
    await expect(import('@/app/about/page')).resolves.toBeDefined();
    await expect(import('@/app/posts/[slug]/page')).resolves.toBeDefined();
  });
});
