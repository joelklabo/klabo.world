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
  it('creates a caller without throwing', async () => {
    const { createServerCaller } = await import('../src/server/trpc/caller');
    const caller = await createServerCaller({ skipAuth: true });
    expect(caller).toBeTruthy();
  });
});
