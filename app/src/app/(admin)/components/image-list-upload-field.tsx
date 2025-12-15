'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type Tone = 'indigo' | 'purple' | 'emerald';

const inputTone: Record<Tone, string> = {
  indigo: 'focus:border-indigo-500 focus:ring-indigo-500',
  purple: 'focus:border-purple-500 focus:ring-purple-500',
  emerald: 'focus:border-emerald-500 focus:ring-emerald-500',
};

const buttonTone: Record<Tone, string> = {
  indigo: 'border-indigo-200 text-indigo-600',
  purple: 'border-purple-200 text-purple-600',
  emerald: 'border-emerald-200 text-emerald-600',
};

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  helperText?: string;
  placeholder?: string;
  tone?: Tone;
  textareaTestId?: string;
  uploadButtonTestId?: string;
};

type Status = 'idle' | 'uploading' | 'success' | 'error';

export function ImageListUploadField({
  name,
  label,
  defaultValue = '',
  helperText,
  placeholder,
  tone = 'indigo',
  textareaTestId,
  uploadButtonTestId,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const appendValue = useCallback((url: string) => {
    setValue((prev) => (prev ? `${prev}\n${url}` : url));
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setStatus('uploading');
    setError(null);
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
      appendValue(data.url);
      setStatus('success');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
      setStatus('error');
    }
  }, [appendValue]);

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
    <div>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        <textarea
          name={name}
          rows={5}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          className={`mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 ${inputTone[tone]}`}
          data-testid={textareaTestId}
        />
      </label>
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="xs"
          className={`bg-transparent hover:bg-gray-50 ${buttonTone[tone]}`}
          data-testid={uploadButtonTestId}
        >
          Upload + append URL
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
        {status === 'uploading' && <span className="text-gray-500">Uploading…</span>}
        {status === 'success' && <span className="text-gray-600">Added latest upload.</span>}
        {status === 'error' && error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
