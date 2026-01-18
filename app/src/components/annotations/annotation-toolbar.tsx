'use client';

import { useAnnotationMode } from './annotation-mode-provider';

export function AnnotationToolbar() {
  const { mode, setMode, counts } = useAnnotationMode();

  return (
    <div className="sticky top-14 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="toolbar" aria-label="Annotation tools">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === 'comment' ? 'view' : 'comment')}
          aria-pressed={mode === 'comment'}
          className={`
            flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
            ${mode === 'comment' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}
          `}
        >
          <span aria-hidden="true">💬</span>
          <span>Comment</span>
          <kbd className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-xs font-mono">C</kbd>
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
          aria-pressed={mode === 'draw'}
          className={`
            flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium motion-safe:transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
            ${mode === 'draw' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}
          `}
        >
          <span aria-hidden="true">✏️</span>
          <span>Draw</span>
          <kbd className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-xs font-mono">D</kbd>
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {counts.open > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            {counts.open} open
          </span>
        )}
        {counts.resolved > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            {counts.resolved} resolved
          </span>
        )}
      </div>
    </div>
  );
}
