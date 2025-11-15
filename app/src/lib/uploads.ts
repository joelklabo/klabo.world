import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadBuffer } from './blob-service';
import { env } from './env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const AZURE_CONFIGURED = Boolean(process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY);

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
  const filename = `${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (AZURE_CONFIGURED) {
    const url = await uploadBuffer(filename, buffer, mime);
    return { url, filename, storage: 'azure' as const };
  }

  const uploadsDir = resolveUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return { url: buildLocalUrl(filename), filename, storage: 'local' as const };
}
