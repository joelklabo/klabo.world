'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImageUpload } from './image-upload-hook';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  helperText?: string;
  placeholder?: string;
  inputTestId?: string;
  uploadButtonTestId?: string;
};

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
  const [uploadedPath, setUploadedPath] = useState<string | null>(defaultValue || null);
  const {
    fileInputRef,
    onFileChange,
    triggerUpload,
    status,
    error,
    retryAfterSeconds,
    setStatus,
    setError,
    setRetryAfterSeconds,
  } = useImageUpload({
    onSuccess: (result) => {
      setValue(result.url);
      setUploadedPath(result.url);
      if (result.scanStatus === 'processing') {
        setStatus('quarantined');
      } else {
        setStatus('success');
      }
      setError(null);
      setRetryAfterSeconds(null);
    },
    onFailure: (result) => {
      if (result.statusCode === 429) {
        setRetryAfterSeconds(result.retryAfterSeconds);
        setError(result.message && result.message !== 'Upload failed' ? result.message : 'Too many uploads. Please try again later.');
      } else if (result.statusCode === 400) {
        setError(`Invalid file: ${result.message || 'Upload failed'}`);
      } else {
        setError(result.message || 'Upload failed');
      }
      setStatus(result.statusCode === 429 ? 'rate-limited' : 'error');
    },
  });

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
          onClick={triggerUpload}
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
