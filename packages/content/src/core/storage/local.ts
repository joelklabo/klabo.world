import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { StorageProvider } from './types.js';

export class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  private resolvePath(filePath: string): string {
    // If absolute, use as-is; otherwise resolve from basePath
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.basePath, filePath);
  }

  async read(filePath: string): Promise<string> {
    const fullPath = this.resolvePath(filePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async write(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.unlink(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(directory: string): Promise<string[]> {
    const fullPath = this.resolvePath(directory);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}
