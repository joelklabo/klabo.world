'use client';

import { useCallback, useState } from 'react';

type Tone = 'indigo' | 'emerald';

const inputTone: Record<Tone, string> = {
  indigo: 'focus:border-indigo-500 focus:ring-indigo-500',
  emerald: 'focus:border-emerald-500 focus:ring-emerald-500',
};

const badgeTone: Record<Tone, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
};

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
  tone = 'indigo',
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
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        <textarea
          name={name}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          className={`mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 ${inputTone[tone]}`}
          data-testid={textareaTestId}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        <button
          type="button"
          onClick={handlePreview}
          className="rounded-full border border-gray-300 px-4 py-1 font-semibold text-gray-700 hover:bg-gray-50"
          data-testid={previewButtonTestId}
        >
          {status === 'loading' ? 'Rendering preview…' : 'Refresh preview'}
        </button>
        {status === 'success' && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone[tone]}`}>Preview updated</span>}
        {status === 'error' && error && <span className="text-red-600">{error}</span>}
      </div>
      {previewHTML && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-widest text-gray-400">Preview</p>
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewHTML }} />
        </div>
      )}
    </div>
  );
}
