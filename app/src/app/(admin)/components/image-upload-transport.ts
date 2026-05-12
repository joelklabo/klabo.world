import type { ChangeEvent } from 'react';

type UploadError = {
  ok: false;
  message: string;
  statusCode: number;
  retryAfterSeconds: number | null;
};

type UploadSuccess = {
  ok: true;
  url: string;
  scanStatus: string | null;
};

export type UploadImageResult = UploadSuccess | UploadError;

const parseRetryAfterSeconds = (response: Response, payload: { retryAfter?: unknown }) => {
  if (typeof payload.retryAfter === 'number' && Number.isFinite(payload.retryAfter)) {
    return payload.retryAfter;
  }

  const retryAfterHeader = response.headers.get('Retry-After');
  if (!retryAfterHeader) {
    return null;
  }

  const parsedHeader = Number.parseInt(retryAfterHeader, 10);
  return Number.isFinite(parsedHeader) ? parsedHeader : null;
};

export async function handleImageUploadChange(
  event: ChangeEvent<HTMLInputElement>,
  upload: (file: File) => Promise<void>,
) {
  const file = event.target.files?.[0];
  if (!file) return;
  await upload(file);
  event.target.value = '';
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/admin/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const payload = await response.json().catch(() => ({} as { error?: unknown; retryAfter?: unknown; url?: unknown; status?: unknown }));
    const payloadError =
      typeof payload.error === 'string' && payload.error.trim() !== ''
        ? payload.error
        : 'Upload failed';

    if (!response.ok) {
      return {
        ok: false,
        message: payloadError,
        statusCode: response.status,
        retryAfterSeconds: parseRetryAfterSeconds(response, payload),
      };
    }

    if (typeof payload.url !== 'string' || payload.url.length === 0) {
      return {
        ok: false,
        message: 'Upload failed',
        statusCode: response.status,
        retryAfterSeconds: null,
      };
    }

    return {
      ok: true,
      url: payload.url,
      scanStatus: typeof payload.status === 'string' ? payload.status : null,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Upload failed',
      statusCode: 0,
      retryAfterSeconds: null,
    };
  }
}
