'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleImageUploadChange, uploadImage } from './image-upload-transport';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  helperText?: string;
  placeholder?: string;
  inputTestId?: string;
  uploadButtonTestId?: string;
};

type Status = 'idle' | 'uploading' | 'success' | 'error' | 'rate-limited' | 'quarantined';

export function ImageUploadField({
  name,
  label,
  defaultValue = '',
  helperText,
  placeholder,
  inputTestId,
  uploadButtonTestId,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(defaultValue || null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setStatus('uploading');
    setError(null);
    setRetryAfterSeconds(null);
    const result = await uploadImage(file);
    if (!result.ok) {
      if (result.statusCode === 429) {
        setRetryAfterSeconds(result.retryAfterSeconds);
        setError(
          result.message && result.message !== 'Upload failed'
            ? result.message
            : 'Too many uploads. Please try again later.',
        );
        setStatus('rate-limited');
        return;
      }
      const message = result.message || 'Upload failed';
      setError(result.statusCode === 400 ? `Invalid file: ${message}` : message);
      setStatus('error');
      return;
    }
    setValue(result.url);
    setUploadedPath(result.url);
    setStatus(result.scanStatus === 'processing' ? 'quarantined' : 'success');
  }, []);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => handleImageUploadChange(event, handleUpload),
    [handleUpload],
  );

  const onBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        data-testid={inputTestId}
      />
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button
          type="button"
          onClick={onBrowseClick}
          variant="outline"
          size="xs"
          data-testid={uploadButtonTestId}
        >
          Upload image
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} aria-label="Upload image file" />
        {status === 'uploading' && <span className="text-muted-foreground" role="status" aria-live="polite">Uploading…</span>}
        {status === 'success' && uploadedPath && <span className="text-primary">Uploaded! {uploadedPath}</span>}
        {status === 'quarantined' && (
          <span className="text-amber-600">
            Upload queued for scanning. We will publish the asset once it clears.
          </span>
        )}
        {status === 'rate-limited' && (
          <span className="text-amber-600">
            {error ?? 'Upload rate limit reached.'}
            {retryAfterSeconds ? ` Try again in ${retryAfterSeconds}s.` : ''}
          </span>
        )}
        {status === 'error' && error && <span className="text-destructive" role="alert" aria-live="assertive">{error}</span>}
      </div>
    </div>
  );
}
