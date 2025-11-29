import { randomUUID } from 'node:crypto';
import { createBlobContainerClient, uploadBuffer } from './blob';

export interface UploadConfig {
  uploadsDir: string;
  uploadsContainerUrl?: string;
  accountName?: string;
  accountKey?: string;
  container?: string;
}

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
}

export async function writeLocalUpload(config: UploadConfig, filename: string, buffer: Buffer): Promise<UploadResult> {
  const path = `${config.uploadsDir}/${filename}`;
  const fs = await import('node:fs/promises');
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.writeFile(path, buffer);
  return { filename, path, url: `/uploads/${filename}` };
}

export async function writeBlobUpload(config: UploadConfig, filename: string, buffer: Buffer, mimeType: string) {
  if (!config.accountName || !config.accountKey || !config.container) {
    throw new Error('Azure storage credentials missing');
  }
  const containerClient = createBlobContainerClient({
    accountName: config.accountName,
    accountKey: config.accountKey,
    container: config.container,
  });
  const url = await uploadBuffer(containerClient, filename, buffer, mimeType);
  return { filename, path: filename, url };
}

export function buildFilename(originalName: string) {
  const ext = originalName.includes('.') ? `.${originalName.split('.').pop()}` : '';
  return `${randomUUID()}${ext}`;
}
