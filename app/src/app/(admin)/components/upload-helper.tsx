'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

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
    const formData = new FormData();
    formData.append('file', file);
    setStatus('uploading');
    setMessage('');
    try {
      const response = await fetch('/admin/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(data.url).catch(() => {});
      }
      setStatus('success');
      setMessage(`Copied ${data.url} to clipboard`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Upload failed');
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
        <input type="file" className="hidden" accept="image/*" ref={inputRef} onChange={onFileChange} />
        {status === 'uploading' && <span className="text-muted-foreground" data-testid={statusTestId}>Uploading…</span>}
        {status === 'success' && <span className="text-primary" data-testid={statusTestId}>{message}</span>}
        {status === 'error' && <span className="text-destructive" data-testid={statusTestId}>{message}</span>}
      </div>
    </div>
  );
}
