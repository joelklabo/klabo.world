import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleImageUpload } from '@/lib/uploads';

function createImageFile(type: string, size = 4): File {
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    data[i] = i;
  }
  return new File([data], 'test.png', { type });
}

describe('handleImageUpload (local mode)', () => {
  it('persists PNG uploads to the local uploads directory', async () => {
    const file = createImageFile('image/png');
    const result = await handleImageUpload(file);
    expect(result.storage).toBe('local');
    expect(result.url).toMatch(/^\/uploads\//);

    const savedPath = path.join(process.cwd(), 'public/uploads', result.filename);
    const stats = await fs.stat(savedPath);
    expect(stats.size).toBe(file.size);

    await fs.unlink(savedPath);
  });

  it('rejects unsupported mime types', async () => {
    const file = createImageFile('text/plain');
    await expect(handleImageUpload(file)).rejects.toThrow(/Unsupported file type/);
  });
});
