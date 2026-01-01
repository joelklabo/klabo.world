import { randomUUID } from 'node:crypto';
import { createBlobContainerClient, uploadBuffer } from './blob';
export {
  detectImageMimeType,
  extensionForMime,
  isSupportedImageMime,
  type SupportedImageMime,
} from './uploads-signatures';

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

function sanitizeFilename(originalName: string) {
  const base = originalName.replaceAll('\\', '/').split('/').pop() ?? '';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return cleaned.replace(/^[-.]+/, '').replace(/[-.]+$/, '');
}

function normalizeExtension(extension?: string) {
  if (!extension) return '';
  return extension.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildFilename(originalName: string, extensionOverride?: string) {
  const safeName = sanitizeFilename(originalName);
  const base = safeName.includes('.') ? safeName.slice(0, safeName.lastIndexOf('.')) : safeName;
  const extFromName = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.') + 1) : '';
  const extension = normalizeExtension(extensionOverride ?? extFromName);
  const safeBase = base || 'upload';
  const uniqueBase = `${safeBase}-${randomUUID()}`;
  return extension ? `${uniqueBase}.${extension}` : uniqueBase;
}
