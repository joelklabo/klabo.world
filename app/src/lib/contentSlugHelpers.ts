import fs from 'node:fs/promises';
import path from 'node:path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveAvailableSlug(base: string, directory: string, extension: string): Promise<string> {
  let candidate = base;
  let counter = 1;
  while (await fileExists(path.join(directory, `${candidate}.${extension}`))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}
