import fs from 'node:fs';
import path from 'node:path';

export function resolveContentDir(): string {
  const candidateDirs = [
    path.resolve(process.cwd(), 'content'),
    path.resolve(process.cwd(), '../content'),
  ];
  return candidateDirs.find((dir) => fs.existsSync(dir)) ?? candidateDirs[0];
}

export function resolveContentSubdir(subdir: string): string {
  return path.join(resolveContentDir(), subdir);
}
