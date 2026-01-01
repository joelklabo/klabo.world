import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleImageUpload } from '@/lib/uploads';
import { env } from '@/lib/env';

function resolveUploadsDir() {
  return path.isAbsolute(env.UPLOADS_DIR) ? env.UPLOADS_DIR : path.join(process.cwd(), env.UPLOADS_DIR);
}

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function createImageFile(type: string, payloadSize = 4): File {
  const prefix = type === 'image/png' ? PNG_SIGNATURE : new Uint8Array();
  const data = new Uint8Array(prefix.length + payloadSize);
  data.set(prefix);
  for (let i = 0; i < payloadSize; i += 1) {
    data[prefix.length + i] = i;
  }
  return new File([data], 'test.png', { type });
}

describe('handleImageUpload (local mode)', () => {
  it('persists PNG uploads to the local uploads directory', async () => {
    const file = createImageFile('image/png');
    const result = await handleImageUpload(file);
    expect(result.storage).toBe('local');
    expect(result.url).toMatch(/^\/uploads\//);

    const savedPath = path.join(resolveUploadsDir(), result.filename);
    const stats = await fs.stat(savedPath);
    expect(stats.size).toBe(file.size);

    await fs.unlink(savedPath);
  });

  it('rejects unsupported mime types', async () => {
    const file = createImageFile('text/plain');
    await expect(handleImageUpload(file)).rejects.toThrow(/Unsupported file type/);
  });
});
