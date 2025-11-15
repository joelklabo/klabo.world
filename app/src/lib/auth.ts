import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { env } from './env';

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function isBcryptHash(value: string): boolean {
  return BCRYPT_PATTERN.test(value);
}

export async function ensureAdminSeeded(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const adminPassword = env.ADMIN_PASSWORD;
  const envProvidesHash = isBcryptHash(adminPassword);
  let cachedHash: string | null = envProvidesHash ? adminPassword : null;
  const resolveHash = async (): Promise<string> => {
    if (cachedHash) {
      return cachedHash;
    }
    cachedHash = await bcrypt.hash(adminPassword, 10);
    return cachedHash;
  };

  const existing = await prisma.admin.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (!existing) {
    await prisma.admin.create({
      data: {
        email: env.ADMIN_EMAIL,
        passwordHash: await resolveHash(),
      },
    });
    return;
  }

  if (envProvidesHash) {
    if (existing.passwordHash !== adminPassword) {
      await prisma.admin.update({
        where: { email: env.ADMIN_EMAIL },
        data: { passwordHash: adminPassword },
      });
    }
    return;
  }

  const matches = await bcrypt.compare(adminPassword, existing.passwordHash);
  if (!matches) {
    await prisma.admin.update({
      where: { email: env.ADMIN_EMAIL },
      data: {
        passwordHash: await resolveHash(),
      },
    });
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return false;
  }
  return bcrypt.compare(password, admin.passwordHash);
}
