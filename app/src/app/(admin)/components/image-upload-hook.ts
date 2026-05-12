import { useCallback, useRef, useState } from 'react';
import { handleImageUploadChange, uploadImage, type UploadImageResult } from './image-upload-transport';

type UploadSuccess = Extract<UploadImageResult, { ok: true }>;
type UploadFailure = Extract<UploadImageResult, { ok: false }>;

type UseImageUploadOptions = {
  onSuccess: (result: UploadSuccess) => void;
  onFailure: (result: UploadFailure) => void;
};

export type ImageUploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'rate-limited' | 'quarantined';

export function useImageUpload({
  onSuccess,
  onFailure,
}: UseImageUploadOptions) {
  const [status, setStatus] = useState<ImageUploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setStatus('uploading');
      setError(null);
      setRetryAfterSeconds(null);

      const result = await uploadImage(file);
      if (!result.ok) {
        setStatus(result.statusCode === 429 ? 'rate-limited' : 'error');
        setError(result.message);
        setRetryAfterSeconds(result.retryAfterSeconds);
        onFailure(result);
        return;
      }

      setStatus(result.scanStatus === 'processing' ? 'quarantined' : 'success');
      onSuccess(result as UploadSuccess);
    },
    [onFailure, onSuccess],
  );

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => handleImageUploadChange(event, handleUpload), [handleUpload]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    status,
    error,
    retryAfterSeconds,
    fileInputRef,
    onFileChange,
    triggerUpload,
    setStatus,
    setError,
    setRetryAfterSeconds,
  };
}

