const SUPPORTED_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

export type SupportedImageMime = (typeof SUPPORTED_IMAGE_MIMES)[number];

const EXTENSION_BY_MIME: Record<SupportedImageMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function matchesSignature(buffer: Buffer, signature: number[], offset = 0) {
  if (buffer.length < signature.length + offset) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

function matchesWebp(buffer: Buffer) {
  if (buffer.length < 12) return false;
  return (
    buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}

export function isSupportedImageMime(mime?: string | null): mime is SupportedImageMime {
  return Boolean(mime && (SUPPORTED_IMAGE_MIMES as readonly string[]).includes(mime));
}

export function detectImageMimeType(buffer: Buffer): SupportedImageMime | null {
  if (matchesSignature(buffer, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    return 'image/png';
  }
  if (matchesSignature(buffer, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }
  if (matchesSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) {
    return 'image/gif';
  }
  if (matchesSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
    return 'image/gif';
  }
  if (matchesWebp(buffer)) {
    return 'image/webp';
  }
  return null;
}

export function extensionForMime(mime: SupportedImageMime): string {
  return EXTENSION_BY_MIME[mime];
}
