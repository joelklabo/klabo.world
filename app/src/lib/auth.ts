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
  const passwordHash = envProvidesHash ? adminPassword : await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: env.ADMIN_EMAIL },
    create: {
      email: env.ADMIN_EMAIL,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return false;
  }
  return bcrypt.compare(password, admin.passwordHash);
}
