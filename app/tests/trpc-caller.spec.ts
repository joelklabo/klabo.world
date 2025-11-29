import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('createServerCaller helper', () => {
  it('returns tRPC results without HTTP when flag is on', async () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ 'api-layer-pilot': true });
    const { createServerCaller } = await import('../src/server/trpc/caller');
    const caller = await createServerCaller({ skipAuth: true });
    const contexts = await caller.contexts.list();
    expect(Array.isArray(contexts)).toBe(true);
  });
});
