import { beforeEach, describe, expect, it, vi } from 'vitest';

const envOverrides = {
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'plain-secret',
};

const upsertMock = vi.fn();

vi.mock('@/lib/env', () => ({
  env: envOverrides,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    admin: {
      upsert: (...args: unknown[]) => upsertMock(...args),
    },
  },
}));

const { ensureAdminSeeded } = await import('@/lib/auth');

describe('ensureAdminSeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates or updates admin using hashed env password when ADMIN_PASSWORD is already a bcrypt hash', async () => {
    const hashedPassword = '$2b$12$e0NRZoLJ9DPE6s6HeXxueOXh3C7hIzyqQg1G4v1D8jg3pa0bX27nS';
    envOverrides.ADMIN_PASSWORD = hashedPassword;

    await ensureAdminSeeded();

    expect(upsertMock).toHaveBeenCalledWith({
      where: { email: envOverrides.ADMIN_EMAIL },
      create: { email: envOverrides.ADMIN_EMAIL, passwordHash: hashedPassword },
      update: { passwordHash: hashedPassword },
    });
  });

  it('hashes plaintext admin password and writes it for both create and update paths', async () => {
    envOverrides.ADMIN_PASSWORD = 'change-me';

    await ensureAdminSeeded();

    const call = upsertMock.mock.calls.at(-1)?.[0];
    expect(call?.create?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(call?.create?.passwordHash).not.toEqual(envOverrides.ADMIN_PASSWORD);
    expect(call?.update?.passwordHash).toEqual(call?.create?.passwordHash);
  });
});
