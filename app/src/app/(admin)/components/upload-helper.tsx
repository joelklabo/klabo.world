'use client';

import { useCallback, useRef, useState } from 'react';

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
        await navigator.clipboard.writeText(data.url).catch(() => undefined);
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
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
      <p className="font-semibold">Need to embed images in Markdown?</p>
      <p className="mt-1 text-emerald-700">Upload here and we&apos;ll copy the URL to your clipboard.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-emerald-300 px-4 py-1 font-semibold text-emerald-700 hover:bg-white"
          data-testid={buttonTestId}
        >
          Upload + copy URL
        </button>
        <input type="file" className="hidden" accept="image/*" ref={inputRef} onChange={onFileChange} />
        {status === 'uploading' && <span data-testid={statusTestId}>Uploading…</span>}
        {status !== 'idle' && status !== 'uploading' && <span data-testid={statusTestId}>{message}</span>}
      </div>
    </div>
  );
}
