import { beforeEach, describe, expect, it, vi } from 'vitest';

const envOverrides = {
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'plain-secret',
};

const findUniqueMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@/lib/env', () => ({
  env: envOverrides,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    admin: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

const { ensureAdminSeeded } = await import('@/lib/auth');

describe('ensureAdminSeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates admin using hashed env password when ADMIN_PASSWORD is already a bcrypt hash', async () => {
    const hashedPassword = '$2b$12$e0NRZoLJ9DPE6s6HeXxueOXh3C7hIzyqQg1G4v1D8jg3pa0bX27nS';
    envOverrides.ADMIN_PASSWORD = hashedPassword;
    findUniqueMock.mockResolvedValueOnce(null);

    await ensureAdminSeeded();

    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: envOverrides.ADMIN_EMAIL,
        passwordHash: hashedPassword,
      },
    });
  });

  it('updates admin directly when env supplies a different bcrypt hash', async () => {
    const hashedPassword = '$2b$12$5mwrZiz.MpaE8FHbszl7fOV6mUD9tnE99S29h5GmmpDYSP/CPNCdi';
    envOverrides.ADMIN_PASSWORD = hashedPassword;
    findUniqueMock.mockResolvedValueOnce({
      email: envOverrides.ADMIN_EMAIL,
      passwordHash: '$2b$12$somethingDifferent.........................',
    });

    await ensureAdminSeeded();

    expect(updateMock).toHaveBeenCalledWith({
      where: { email: envOverrides.ADMIN_EMAIL },
      data: { passwordHash: hashedPassword },
    });
  });

  it('hashes plaintext admin password when env provides plain text', async () => {
    envOverrides.ADMIN_PASSWORD = 'change-me';
    findUniqueMock.mockResolvedValueOnce(null);

    await ensureAdminSeeded();

    const call = createMock.mock.calls.at(-1);
    expect(call?.[0]?.data?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(call?.[0]?.data?.passwordHash).not.toEqual(envOverrides.ADMIN_PASSWORD);
  });
});
