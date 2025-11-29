import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildFilename, writeBlobUpload, writeLocalUpload } from '@klaboworld/core';
import { env } from './env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const AZURE_CONFIGURED = Boolean(env.AZURE_STORAGE_ACCOUNT && env.AZURE_STORAGE_KEY);

function resolveUploadsDir() {
  return path.isAbsolute(env.UPLOADS_DIR) ? env.UPLOADS_DIR : path.join(process.cwd(), env.UPLOADS_DIR);
}

function buildLocalUrl(filename: string): string {
  const normalized = env.UPLOADS_DIR.replace(/^\.\//, '').replace(/\\/g, '/');
  if (normalized.startsWith('public/')) {
    const relative = normalized.slice('public'.length).replace(/^\//, '');
    return `/${relative ? `${relative}/` : ''}${filename}`.replace(/\/+/g, '/');
  }
  return `/uploads/${filename}`;
}

function getMimeType(file: File) {
  const mime = file.type?.toLowerCase();
  if (!mime || !MIME_EXTENSION[mime]) {
    throw new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.');
  }
  return mime;
}

function assertValidFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
}

export async function handleImageUpload(file: File) {
  const mime = getMimeType(file);
  assertValidFile(file);
  const extension = MIME_EXTENSION[mime];
  const filename = buildFilename(`${crypto.randomUUID()}.${extension}`);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (AZURE_CONFIGURED) {
    const result = await writeBlobUpload(
      {
        uploadsDir: env.UPLOADS_DIR,
        uploadsContainerUrl: env.UPLOADS_CONTAINER_URL,
        accountName: env.AZURE_STORAGE_ACCOUNT,
        accountKey: env.AZURE_STORAGE_KEY,
        container: env.AZURE_STORAGE_CONTAINER ?? 'uploads',
      },
      filename,
      buffer,
      mime,
    );
    return { url: result.url, filename: result.filename, storage: 'azure' as const };
  }

  const uploadsDir = resolveUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const result = await writeLocalUpload(
    { uploadsDir, uploadsContainerUrl: env.UPLOADS_CONTAINER_URL },
    filename,
    buffer,
  );
  return { url: buildLocalUrl(result.filename), filename: result.filename, storage: 'local' as const };
}
