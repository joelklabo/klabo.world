import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleImageUpload } from '@/lib/uploads';
import { env } from '@/lib/env';

function resolveUploadsDir() {
  return path.isAbsolute(env.UPLOADS_DIR) ? env.UPLOADS_DIR : path.join(process.cwd(), env.UPLOADS_DIR);
}

function resolveQuarantineDir() {
  return path.join(resolveUploadsDir(), 'quarantine');
}

const PNG_FIXTURE = fileURLToPath(new URL('../public/images/logo.png', import.meta.url));

async function createPngFile(): Promise<File> {
  const data = await fs.readFile(PNG_FIXTURE);
  return new File([data], 'test.png', { type: 'image/png' });
}

function createImageFile(type: string, payloadSize = 4): File {
  const data = new Uint8Array(payloadSize);
  for (let i = 0; i < payloadSize; i += 1) {
    data[i] = i;
  }
  return new File([data], 'test.txt', { type });
}

describe('handleImageUpload (local mode)', () => {
  it('persists PNG uploads to the local uploads directory', async () => {
    const file = await createPngFile();
    const result = await handleImageUpload(file);
    expect(result.storage).toBe('local');
    expect(result.url).toMatch(/^\/uploads\//);
    expect(result.status).toBe('processing');

    const savedPath = path.join(resolveQuarantineDir(), result.filename);
    const stats = await fs.stat(savedPath);
    expect(stats.size).toBeGreaterThan(0);

    await fs.unlink(savedPath);
    const metadataPath = `${savedPath}.metadata.json`;
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    expect(metadata.scanStatus).toBe('processing');
    await fs.unlink(metadataPath);
  });

  it('rejects unsupported mime types', async () => {
    const file = createImageFile('text/plain');
    await expect(handleImageUpload(file)).rejects.toThrow(/Unsupported file type/);
  });
});
