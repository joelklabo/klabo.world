import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_DATABASE_URL } from './site-config';
let warnedDefaultUrl = false;

export function ensureDatabaseDirectory(url?: string) {
  const databaseUrl = url ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
    if (!warnedDefaultUrl) {
      warnedDefaultUrl = true;
      console.warn('DATABASE_URL not set; falling back to default SQLite path.');
    }
  }
  if (!databaseUrl.startsWith('file:')) {
    return;
  }
  const rawPath = databaseUrl.replace(/^file:/, '');
  const resolvedPath = rawPath.startsWith('/') ? rawPath : path.join(process.cwd(), rawPath);
  const dir = path.dirname(resolvedPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    console.warn('Failed to ensure database directory', dir, error);
  }
}
