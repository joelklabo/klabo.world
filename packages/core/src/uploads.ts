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

export type UploadScanStatus = 'processing' | 'clean' | 'quarantined' | 'scan_failed';
export type UploadScanPolicy = 'fail-open' | 'fail-closed';

export interface UploadMetadata {
  scanStatus?: UploadScanStatus;
  scanPolicy?: UploadScanPolicy;
  scanRequestedAt?: string;
}

export interface UploadResult {
  filename: string;
  path: string;
  url: string;
  metadata?: UploadMetadata;
}

function toBlobMetadata(metadata?: UploadMetadata): Record<string, string> | undefined {
  if (!metadata) return undefined;
  const entries: Record<string, string> = {};
  if (metadata.scanStatus) entries.scanstatus = metadata.scanStatus;
  if (metadata.scanPolicy) entries.scanpolicy = metadata.scanPolicy;
  if (metadata.scanRequestedAt) entries.scanrequestedat = metadata.scanRequestedAt;
  return Object.keys(entries).length > 0 ? entries : undefined;
}

export async function writeLocalUpload(
  config: UploadConfig,
  filename: string,
  buffer: Buffer,
  metadata?: UploadMetadata,
): Promise<UploadResult> {
  const path = `${config.uploadsDir}/${filename}`;
  const fs = await import('node:fs/promises');
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.writeFile(path, buffer);
  if (metadata) {
    const metadataPath = `${config.uploadsDir}/${filename}.metadata.json`;
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }
  return { filename, path, url: `/uploads/${filename}`, metadata };
}

export async function writeBlobUpload(
  config: UploadConfig,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  metadata?: UploadMetadata,
) {
  if (!config.accountName || !config.accountKey || !config.container) {
    throw new Error('Azure storage credentials missing');
  }
  const containerClient = createBlobContainerClient({
    accountName: config.accountName,
    accountKey: config.accountKey,
    container: config.container,
  });
  const url = await uploadBuffer(containerClient, filename, buffer, mimeType, toBlobMetadata(metadata));
  return { filename, path: filename, url, metadata };
}

export interface PromoteUploadConfig {
  accountName: string;
  accountKey: string;
  sourceContainer: string;
  destinationContainer: string;
}

export async function promoteBlobUpload(
  config: PromoteUploadConfig,
  filename: string,
  metadata?: UploadMetadata,
): Promise<UploadResult> {
  const sourceClient = createBlobContainerClient({
    accountName: config.accountName,
    accountKey: config.accountKey,
    container: config.sourceContainer,
  });
  const destinationClient = createBlobContainerClient({
    accountName: config.accountName,
    accountKey: config.accountKey,
    container: config.destinationContainer,
  });
  await destinationClient.createIfNotExists();
  const sourceBlob = sourceClient.getBlobClient(filename);
  const destinationBlob = destinationClient.getBlockBlobClient(filename);
  const poller = await destinationBlob.beginCopyFromURL(sourceBlob.url);
  await poller.pollUntilDone();
  if (metadata) {
    await destinationBlob.setMetadata(toBlobMetadata(metadata));
  }
  return { filename, path: filename, url: destinationBlob.url, metadata };
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
