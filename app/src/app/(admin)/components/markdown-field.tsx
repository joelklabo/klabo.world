'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Tone = 'indigo' | 'emerald';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  tone?: Tone;
  textareaTestId?: string;
  previewButtonTestId?: string;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export function MarkdownField({
  name,
  label,
  defaultValue = '',
  placeholder,
  helperText,
  rows = 18,
  textareaTestId,
  previewButtonTestId,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePreview = useCallback(async () => {
    if (!value.trim()) {
      setError('Add content to preview.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('/admin/markdown-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value }),
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.html) {
        throw new Error(data?.error || 'Preview failed.');
      }
      setPreviewHTML(data.html);
      setStatus('success');
    } catch (previewError) {
      setStatus('error');
      setError(previewError instanceof Error ? previewError.message : 'Preview failed.');
    }
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          className="font-mono"
          data-testid={textareaTestId}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
        <Button
          type="button"
          onClick={handlePreview}
          variant="outline"
          size="sm"
          data-testid={previewButtonTestId}
        >
          {status === 'loading' ? 'Rendering preview…' : 'Refresh preview'}
        </Button>
        {status === 'success' && (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
            Preview updated
          </span>
        )}
        {status === 'error' && error && <span className="text-destructive">{error}</span>}
      </div>
      {previewHTML && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewHTML }} />
        </div>
      )}
    </div>
  );
}
