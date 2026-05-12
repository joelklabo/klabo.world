'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { handleImageUploadChange, uploadImage } from './image-upload-transport';

type Status = 'idle' | 'uploading' | 'success' | 'error';

type Props = {
  buttonTestId?: string;
  statusTestId?: string;
};

export function MarkdownUploadHelper({ buttonTestId, statusTestId }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setStatus('uploading');
    setMessage('');
    const result = await uploadImage(file);
    if (!result.ok) {
      setStatus('error');
      setMessage(result.message || 'Upload failed');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(result.url).catch(() => {});
    }
    setStatus('success');
    setMessage(`Copied ${result.url} to clipboard`);
  }, []);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => handleImageUploadChange(event, handleUpload),
    [handleUpload],
  );

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
      <p className="font-semibold">Need to embed images in Markdown?</p>
      <p className="mt-1 text-muted-foreground">Upload here and we&apos;ll copy the URL to your clipboard.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          variant="outline"
          size="sm"
          data-testid={buttonTestId}
        >
          Upload + copy URL
        </Button>
        <input type="file" className="hidden" accept="image/*" ref={inputRef} onChange={onFileChange} aria-label="Upload image and copy URL" />
        {status === 'uploading' && <span className="text-muted-foreground" data-testid={statusTestId} role="status" aria-live="polite">Uploading…</span>}
        {status === 'success' && <span className="text-primary" data-testid={statusTestId} role="status" aria-live="polite">{message}</span>}
        {status === 'error' && <span className="text-destructive" data-testid={statusTestId} role="alert" aria-live="assertive">{message}</span>}
      </div>
    </div>
  );
}
