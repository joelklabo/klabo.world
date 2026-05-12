'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from './image-upload-hook';
import { ImageUploadStatus } from './image-upload-status';

type Props = {
  buttonTestId?: string;
  statusTestId?: string;
};

export function MarkdownUploadHelper({ buttonTestId, statusTestId }: Props) {
  const [message, setMessage] = useState<string>('');
  const { fileInputRef, onFileChange, triggerUpload, status, setStatus } = useImageUpload({
    onSuccess: async (result) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result.url).catch(() => {});
      }
      setStatus('success');
      setMessage(`Copied ${result.url} to clipboard`);
    },
    onFailure: (result) => {
      setStatus('error');
      setMessage(result.message || 'Upload failed');
    },
  });

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
      <p className="font-semibold">Need to embed images in Markdown?</p>
      <p className="mt-1 text-muted-foreground">Upload here and we&apos;ll copy the URL to your clipboard.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={triggerUpload}
          variant="outline"
          size="sm"
          data-testid={buttonTestId}
        >
          Upload + copy URL
        </Button>
        <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={onFileChange} aria-label="Upload image and copy URL" />
        <ImageUploadStatus
          status={status}
          successMessage={message}
          errorMessage={message}
          successClassName="text-primary"
          successRole="status"
          statusTestId={statusTestId}
        />
      </div>
    </div>
  );
}
