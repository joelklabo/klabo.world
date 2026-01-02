import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { handleImageUpload } from '@/lib/uploads';
import { env } from '@/lib/env';

function resolveUploadsDir() {
  return path.isAbsolute(env.UPLOADS_DIR) ? env.UPLOADS_DIR : path.join(process.cwd(), env.UPLOADS_DIR);
}

function resolveQuarantineDir() {
  return path.join(resolveUploadsDir(), 'quarantine');
}

const FIXTURES_DIR = fileURLToPath(new URL('fixtures/uploads/', import.meta.url));
const PNG_FIXTURE = path.join(FIXTURES_DIR, 'valid.png');
const JPEG_FIXTURE = path.join(FIXTURES_DIR, 'valid.jpg');
const JPEG_EXIF_FIXTURE = path.join(FIXTURES_DIR, 'exif.jpg');
const INVALID_FIXTURE = path.join(FIXTURES_DIR, 'invalid.bin');

async function createPngFile(): Promise<File> {
  const data = await fs.readFile(PNG_FIXTURE);
  return new File([data], 'test.png', { type: 'image/png' });
}

async function createFileFromFixture(fixturePath: string, name: string, type: string): Promise<File> {
  const data = await fs.readFile(fixturePath);
  return new File([data], name, { type });
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

  it('rejects files whose signatures do not match declared type', async () => {
    const file = await createFileFromFixture(JPEG_FIXTURE, 'spoofed.png', 'image/png');
    await expect(handleImageUpload(file)).rejects.toThrow(/does not match the declared file type/i);
  });

  it('strips EXIF metadata from JPEG uploads', async () => {
    const sourceBuffer = await fs.readFile(JPEG_EXIF_FIXTURE);
    const sourceMeta = await sharp(sourceBuffer).metadata();
    expect(sourceMeta.exif).toBeTruthy();

    const file = new File([sourceBuffer], 'exif.jpg', { type: 'image/jpeg' });
    const result = await handleImageUpload(file);
    const savedPath = path.join(resolveQuarantineDir(), result.filename);
    const savedMeta = await sharp(savedPath).metadata();
    expect(savedMeta.exif).toBeFalsy();

    await fs.unlink(savedPath);
    const metadataPath = `${savedPath}.metadata.json`;
    await fs.unlink(metadataPath);
  });

  it('rejects files with invalid signatures', async () => {
    const file = await createFileFromFixture(INVALID_FIXTURE, 'invalid.png', 'image/png');
    await expect(handleImageUpload(file)).rejects.toThrow(/Unsupported file type/i);
  });

  it('rejects unsupported mime types', async () => {
    const file = createImageFile('text/plain');
    await expect(handleImageUpload(file)).rejects.toThrow(/Unsupported file type/);
  });
});
