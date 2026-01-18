'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Tone = 'indigo' | 'purple' | 'emerald';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  helperText?: string;
  placeholder?: string;
  tone?: Tone;
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
    const formData = new FormData();
    formData.append('file', file);
    setStatus('uploading');
    setError(null);
    setRetryAfterSeconds(null);
    try {
      const response = await fetch('/admin/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterValue =
            typeof data?.retryAfter === 'number'
              ? data.retryAfter
              : retryAfterHeader
                ? Number.parseInt(retryAfterHeader, 10)
                : null;
          if (Number.isFinite(retryAfterValue)) {
            setRetryAfterSeconds(retryAfterValue);
          }
          setError(data?.error || 'Too many uploads. Please try again later.');
          setStatus('rate-limited');
          return;
        }
        const message = data?.error || 'Upload failed';
        const formattedMessage = response.status === 400 ? `Invalid file: ${message}` : message;
        setError(formattedMessage);
        setStatus('error');
        return;
      }
      if (!data?.url) {
        throw new Error('Upload failed');
      }
      setValue(data.url);
      setUploadedPath(data.url);
      if (data?.status === 'processing') {
        setStatus('quarantined');
      } else {
        setStatus('success');
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
      setStatus('error');
    }
  }, []);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await handleUpload(file);
      event.target.value = '';
    },
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
