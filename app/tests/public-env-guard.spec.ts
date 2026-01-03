import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function setStrictProdEnv() {
  process.env.NODE_ENV = 'production';
  process.env.CI = 'false';
  process.env.NEXTAUTH_SECRET = 'dev-secret';
  process.env.DATABASE_URL = 'file:../data/app.db';
  process.env.VITEST = 'true';
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
