'use client';

import { useState, useEffect, useRef } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';
import type { Annotation } from './types';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function AnnotationCard({
  annotation,
  isSelected,
  onSelect,
  onResolve,
  onReply,
  onDelete,
}: {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onResolve: () => void;
  onReply: (content: string) => void;
  onDelete: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const isResolved = annotation.status === 'RESOLVED';

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div
      className={`
        rounded-lg border transition-all cursor-pointer
        ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        ${isResolved ? 'opacity-60' : ''}
      `}
      onClick={onSelect}
    >
      <div className="p-3">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {annotation.pinNumber && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: annotation.color || '#3b82f6' }}
              >
                {annotation.pinNumber}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(annotation.createdAt)}
            </span>
            {isResolved && (
              <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-500">
                Resolved
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm">{annotation.content}</p>

        {/* Replies */}
        {annotation.replies && annotation.replies.length > 0 && (
          <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
            {annotation.replies.map((reply) => (
              <div key={reply.id} className="text-sm">
                <p className="text-muted-foreground">{reply.content}</p>
                <span className="text-xs text-muted-foreground/60">
                  {formatDate(reply.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3">
            <textarea
              ref={replyInputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              aria-label="Reply to annotation"
              placeholder="Reply..."
              className="mb-2 w-full resize-none rounded border border-border bg-background p-2 text-sm focus:border-primary focus:outline-none"
              rows={2}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitReply();
                }
                if (e.key === 'Escape') {
                  setIsReplying(false);
                  setReplyContent('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded px-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReplying(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded px-1 text-xs text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitReply();
                }}
              >
                Reply
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {isSelected && !isReplying && (
          <div className="mt-3 flex gap-2 border-t border-border pt-2">
            {!isResolved && (
              <>
                <button
                  type="button"
                  className="rounded px-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReplying(true);
                  }}
                >
                  Reply (r)
                </button>
                <button
                  type="button"
                  className="rounded px-1 text-xs text-green-500 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                >
                  Resolve (Space)
                </button>
              </>
            )}
            <button
              type="button"
              className="rounded px-1 text-xs text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this annotation?')) {
                  onDelete();
                }
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnnotationSidebar() {
  const {
    annotations,
    selectedId,
    selectAnnotation,
    resolveAnnotation,
    replyToAnnotation,
    deleteAnnotation,
    counts,
    showResolved,
    setShowResolved,
    mode,
  } = useAnnotationMode();

  // Filter annotations
  const openAnnotations = annotations.filter((a) => a.status === 'OPEN');
  const resolvedAnnotations = annotations.filter((a) => a.status === 'RESOLVED');

  // Handle reply keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'r' && selectedId) {
        e.preventDefault();
        // Find the reply button and click it
        const card = document.querySelector(`[data-annotation-id="${selectedId}"]`);
        const replyBtn = card?.querySelector('[data-action="reply"]');
        if (replyBtn instanceof HTMLButtonElement) {
          replyBtn.click();
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-card/50">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Annotations</h2>
            <div className="text-sm text-muted-foreground">
              {counts.open} open, {counts.resolved} resolved
            </div>
          </div>

          {/* Mode indicator */}
          {mode !== 'view' && (
            <div className="mt-2 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
              {mode === 'comment' ? '📝 Comment mode (C)' : '🎨 Draw mode (D)'} — Press Esc to exit
            </div>
          )}

          {/* Controls */}
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="show-resolved-checkbox" className="flex items-center gap-2 text-sm">
              <input
                id="show-resolved-checkbox"
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-border"
              />
              Show resolved
            </label>
          </div>

          {/* Keyboard hints */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">j</kbd>
              <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">k</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">c</kbd>
              <span>comment</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">d</kbd>
              <span>draw</span>
            </span>
          </div>
        </div>

        {/* Annotation list */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Open annotations */}
          {openAnnotations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Open ({openAnnotations.length})
              </h3>
              {openAnnotations.map((annotation) => (
                <div key={annotation.id} data-annotation-id={annotation.id}>
                  <AnnotationCard
                    annotation={annotation}
                    isSelected={selectedId === annotation.id}
                    onSelect={() => selectAnnotation(annotation.id)}
                    onResolve={() => resolveAnnotation(annotation.id)}
                    onReply={(content) => replyToAnnotation(annotation.id, content)}
                    onDelete={() => deleteAnnotation(annotation.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Resolved annotations */}
          {showResolved && resolvedAnnotations.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolved ({resolvedAnnotations.length})
              </h3>
              {resolvedAnnotations.map((annotation) => (
                <div key={annotation.id} data-annotation-id={annotation.id}>
                  <AnnotationCard
                    annotation={annotation}
                    isSelected={selectedId === annotation.id}
                    onSelect={() => selectAnnotation(annotation.id)}
                    onResolve={() => {}}
                    onReply={(content) => replyToAnnotation(annotation.id, content)}
                    onDelete={() => deleteAnnotation(annotation.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {openAnnotations.length === 0 && !showResolved && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No open annotations</p>
              <p className="mt-1">Press C to add a comment</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
