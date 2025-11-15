import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

export function ensureDatabaseDirectory(url: string = env.DATABASE_URL) {
  if (!url.startsWith('file:')) {
    return;
  }
  const rawPath = url.replace(/^file:/, '');
  const resolvedPath = rawPath.startsWith('/') ? rawPath : path.join(process.cwd(), rawPath);
  const dir = path.dirname(resolvedPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    console.warn('Failed to ensure database directory', dir, error);
  }
}
