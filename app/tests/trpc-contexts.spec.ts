import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

async function getCaller() {
  const { appRouter } = await import('../src/server/trpc/router');
  return appRouter.createCaller({ session: null });
}

describe('tRPC contexts router', () => {
  it('blocks when api-layer-pilot flag is off', async () => {
    delete process.env.FEATURE_FLAGS_JSON;
    const caller = await getCaller();
    await expect(caller.contexts.list()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns contexts list when flag is on', async () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ 'api-layer-pilot': true });
    vi.resetModules();
    const caller = await getCaller();
    const contexts = await caller.contexts.list();
    expect(Array.isArray(contexts)).toBe(true);
    expect(contexts.length).toBeGreaterThan(0);
    expect(contexts[0]).toHaveProperty('slug');
  });

  it('search enforces min length', async () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ 'api-layer-pilot': true });
    vi.resetModules();
    const caller = await getCaller();
    await expect(caller.contexts.search({ q: 'a' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('search returns matches when query is valid', async () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ 'api-layer-pilot': true });
    vi.resetModules();
    const caller = await getCaller();
    const results = await caller.contexts.search({ q: 'ios' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });
});
