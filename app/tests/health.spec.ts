import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const probeDatabaseMock = vi.fn();
const isBlobConfiguredMock = vi.fn();
const probeBlobContainerMock = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  probeDatabase: probeDatabaseMock,
}));

vi.mock('../src/lib/blob-service', () => ({
  isBlobConfigured: isBlobConfiguredMock,
  probeBlobContainer: probeBlobContainerMock,
}));

function resetEnv() {
  delete process.env.REDIS_URL;
  delete process.env.HEALTHCHECK_TIMEOUT_MS;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  resetEnv();
  isBlobConfiguredMock.mockReturnValue(false);
  probeDatabaseMock.mockResolvedValue(true);
  probeBlobContainerMock.mockResolvedValue(true);
});

afterEach(() => {
  resetEnv();
});

describe('health checks', () => {
  it('returns ok with skipped optional dependencies', async () => {
    const { runHealthChecks } = await import('../src/lib/healthChecks');

    const result = await runHealthChecks();

    expect(result.hasFailure).toBe(false);
    expect(result.components.db.status).toBe('ok');
    expect(result.components.redis.status).toBe('skipped');
    expect(result.components.blob.status).toBe('skipped');
  });

  it('marks failure when database probe throws', async () => {
    probeDatabaseMock.mockRejectedValueOnce(new Error('db down'));
    const { runHealthChecks } = await import('../src/lib/healthChecks');

    const result = await runHealthChecks();

    expect(result.components.db.status).toBe('failed');
    expect(result.hasFailure).toBe(true);
  });

  it('marks failure when blob check fails while configured', async () => {
    isBlobConfiguredMock.mockReturnValue(true);
    probeBlobContainerMock.mockRejectedValueOnce(new Error('missing container'));
    const { runHealthChecks } = await import('../src/lib/healthChecks');

    const result = await runHealthChecks();

    expect(result.components.blob.status).toBe('failed');
    expect(result.hasFailure).toBe(true);
  });
});
