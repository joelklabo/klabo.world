import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildFilename,
  detectImageMimeType,
  extensionForMime,
  isSupportedImageMime,
  type SupportedImageMime,
  type UploadMetadata,
  writeBlobUpload,
  writeLocalUpload,
} from '@klaboworld/core/server/uploads';
import sharp from 'sharp';
import { env } from './env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const EXIF_STRIP_MIMES = new Set<SupportedImageMime>(['image/jpeg', 'image/png', 'image/webp']);

const AZURE_CONFIGURED = Boolean(env.AZURE_STORAGE_ACCOUNT && env.AZURE_STORAGE_KEY);
const QUARANTINE_CONTAINER_DEFAULT = 'quarantine-uploads';

function resolveUploadsDir(uploadsDir: string) {
  return path.isAbsolute(uploadsDir) ? uploadsDir : path.join(process.cwd(), uploadsDir);
}

function resolveQuarantineDir() {
  const quarantineDir = env.UPLOADS_QUARANTINE_DIR ?? path.join(env.UPLOADS_DIR, 'quarantine');
  return resolveUploadsDir(quarantineDir);
}

function buildLocalUrl(filename: string, uploadsDir: string): string {
  const normalized = uploadsDir.replace(/^\.\//, '').replaceAll('\\', '/');
  if (normalized.startsWith('public/')) {
    const relative = normalized.slice('public'.length).replace(/^\//, '');
    return `/${relative ? `${relative}/` : ''}${filename}`.replaceAll(/\/+/g, '/');
  }
  return `/uploads/${filename}`;
}

function getDeclaredMimeType(file: File): SupportedImageMime | null {
  const rawMime = file.type?.toLowerCase();
  if (!rawMime) return null;
  const normalizedMime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  if (!isSupportedImageMime(normalizedMime)) {
    throw new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.');
  }
  return normalizedMime;
}

function assertValidFile(file: File) {
  if (file.size <= 0) {
    throw new Error('File is empty.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
}

async function stripImageMetadata(buffer: Buffer, mime: SupportedImageMime) {
  if (!EXIF_STRIP_MIMES.has(mime)) return buffer;
  try {
    if (mime === 'image/jpeg') {
      return await sharp(buffer, { failOnError: true }).jpeg({ quality: 100 }).toBuffer();
    }
    if (mime === 'image/png') {
      return await sharp(buffer, { failOnError: true }).png({ compressionLevel: 9 }).toBuffer();
    }
    if (mime === 'image/webp') {
      return await sharp(buffer, { failOnError: true }).webp({ quality: 100 }).toBuffer();
    }
    return buffer;
  } catch (error) {
    throw new Error('Unable to process image metadata. The file may be corrupt.', { cause: error });
  }
}

export async function handleImageUpload(file: File) {
  const declaredMime = getDeclaredMimeType(file);
  assertValidFile(file);
  const isProduction = process.env.NODE_ENV === 'production';
  const scanPolicy = env.UPLOADS_SCAN_FAIL_OPEN && !isProduction ? 'fail-open' : 'fail-closed';
  if (env.UPLOADS_SCAN_FAIL_OPEN && isProduction) {
    console.warn('[uploads] UPLOADS_SCAN_FAIL_OPEN ignored in production; using fail-closed policy.');
  }
  const scanMetadata: UploadMetadata = {
    scanStatus: 'processing',
    scanPolicy,
    scanRequestedAt: new Date().toISOString(),
  };
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const detectedMime = detectImageMimeType(buffer);
  if (!detectedMime) {
    throw new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.');
  }
  if (declaredMime && declaredMime !== detectedMime) {
    throw new Error('File content does not match the declared file type.');
  }
  const extension = extensionForMime(detectedMime);
  const filename = buildFilename(file.name || `upload.${extension}`, extension);
  const sanitizedBuffer = await stripImageMetadata(buffer, detectedMime);

  if (AZURE_CONFIGURED) {
    const quarantineContainer = env.UPLOADS_QUARANTINE_CONTAINER ?? QUARANTINE_CONTAINER_DEFAULT;
    const result = await writeBlobUpload(
      {
        uploadsDir: env.UPLOADS_DIR,
        uploadsContainerUrl: env.UPLOADS_CONTAINER_URL,
        accountName: env.AZURE_STORAGE_ACCOUNT,
        accountKey: env.AZURE_STORAGE_KEY,
        container: quarantineContainer,
      },
      filename,
      sanitizedBuffer,
      detectedMime,
      scanMetadata,
    );
    return {
      url: result.url,
      filename: result.filename,
      storage: 'azure' as const,
      status: scanMetadata.scanStatus,
    };
  }

  const quarantineDir = resolveQuarantineDir();
  await fs.mkdir(quarantineDir, { recursive: true });
  const result = await writeLocalUpload(
    { uploadsDir: quarantineDir, uploadsContainerUrl: env.UPLOADS_CONTAINER_URL },
    filename,
    sanitizedBuffer,
    scanMetadata,
  );
  return {
    url: buildLocalUrl(result.filename, quarantineDir),
    filename: result.filename,
    storage: 'local' as const,
    status: scanMetadata.scanStatus,
  };
}
