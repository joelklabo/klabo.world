import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

describe('feature flags', () => {
  it('returns default when no adapters provide a value', async () => {
    delete process.env.FEATURE_FLAGS_JSON;
    delete process.env.REDIS_URL;
    vi.doUnmock('redis');

    const { getFlag } = await import('../src/lib/flags');
    const result = await getFlag('nostrstack-post-widgets');

    expect(result.value).toBe(true);
    expect(result.source).toBe('default');
    expect(result.isKillSwitch).toBe(false);
  });

  it('prefers env overrides when provided', async () => {
    process.env.FEATURE_FLAGS_JSON = JSON.stringify({ 'nostrstack-post-widgets': false });
    delete process.env.REDIS_URL;
    vi.doUnmock('redis');

    const { getFlag } = await import('../src/lib/flags');
    const result = await getFlag('nostrstack-post-widgets');

    expect(result.value).toBe(false);
    expect(result.source).toBe('env');
  });

  it('uses redis value when available', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    delete process.env.FEATURE_FLAGS_JSON;
    mockRedis({ 'feature-flags:nostrstack-post-widgets': 'false' });

    const { getFlag } = await import('../src/lib/flags');
    const result = await getFlag('nostrstack-post-widgets');

    expect(result.value).toBe(false);
    expect(result.source).toBe('redis');
  });

  it('marks kill-switch when redis forces boolean false and kill severity is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    mockRedis({ 'feature-flags:nostrstack-post-widgets': 'false' });

    const { getFlag } = await import('../src/lib/flags');
    const result = await getFlag('nostrstack-post-widgets');

    expect(result.value).toBe(false);
    expect(result.isKillSwitch).toBe(true);
    expect(result.source).toBe('redis');
  });

  it('lists expired flags relative to provided date', async () => {
    const { listExpiredFlags } = await import('../src/lib/flags');
    const expired = listExpiredFlags(new Date('2027-01-01'));

    expect(expired.map((f) => f.key)).toContain('nostrstack-post-widgets');
  });
});

function mockRedis(seed: Record<string, string>) {
  vi.doMock('redis', () => {
    const store = new Map<string, string>(Object.entries(seed));
    const match = (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return Array.from(store.keys()).filter((key) => key.startsWith(prefix));
    };

    return {
      createClient: () => ({
        isOpen: true,
        connect: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
        mGet: vi.fn((keys: string[]) => Promise.resolve(keys.map((k) => store.get(k) ?? null))),
        keys: vi.fn((pattern: string) => Promise.resolve(match(pattern))),
      }),
    };
  });
}
