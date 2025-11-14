import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { env } from './env';

export async function ensureAdminSeeded(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (!existing) {
    await prisma.admin.create({
      data: {
        email: env.ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 10),
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
