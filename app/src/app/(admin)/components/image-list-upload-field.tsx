'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useImageUpload } from './image-upload-hook';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  helperText?: string;
  placeholder?: string;
  textareaTestId?: string;
  uploadButtonTestId?: string;
};

export function ImageListUploadField({
  name,
  label,
  defaultValue = '',
  helperText,
  placeholder,
  textareaTestId,
  uploadButtonTestId,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const appendValue = useCallback((url: string) => {
    setValue((prev) => (prev ? `${prev}\n${url}` : url));
  }, []);

  const { fileInputRef, onFileChange, triggerUpload, status, setStatus } = useImageUpload({
    onSuccess: (result) => {
      appendValue(result.url);
      setError(null);
      setStatus('success');
    },
    onFailure: (result) => {
      setError(result.message || 'Upload failed');
      setStatus('error');
    },
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        rows={5}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="font-mono"
        data-testid={textareaTestId}
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
          Upload + append URL
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} aria-label="Upload image files" />
        {status === 'uploading' && <span className="text-muted-foreground" role="status" aria-live="polite">Uploading…</span>}
        {status === 'success' && <span className="text-muted-foreground" role="status" aria-live="polite">Added latest upload.</span>}
        {status === 'error' && error && <span className="text-destructive" role="alert" aria-live="assertive">{error}</span>}
      </div>
    </div>
  );
}
