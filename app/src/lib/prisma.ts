import { PrismaClient } from '@prisma/client';
import { ensureDatabaseDirectory } from './ensureDatabaseDirectory';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

ensureDatabaseDirectory();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function probeDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}
