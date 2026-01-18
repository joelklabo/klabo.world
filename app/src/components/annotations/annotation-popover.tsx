'use client';

import { useState, useRef, useEffect } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';

export function AnnotationPopover() {
  const { pendingAnnotation, createAnnotation, setPendingAnnotation, mode } = useAnnotationMode();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = (mode === 'comment' || mode === 'draw') && pendingAnnotation !== null;

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure popover is mounted
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset content when closed
  useEffect(() => {
    if (!isOpen) {
      setContent('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAnnotation(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setPendingAnnotation(null);
    }
  };

  if (!isOpen || !pendingAnnotation?.anchorRect) return null;

  // Calculate position relative to viewport with smart placement
  const { anchorRect } = pendingAnnotation;
  const popoverHeight = 150; // Approximate height of popover
  const popoverWidth = 320; // w-80 = 20rem = 320px
  const gap = 8;
  const viewportHeight = globalThis.window === undefined ? 800 : window.innerHeight;
  const viewportWidth = globalThis.window === undefined ? 1200 : window.innerWidth;

  // Check if there's enough space below
  const spaceBelow = viewportHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const showAbove = spaceBelow < popoverHeight + gap && spaceAbove > spaceBelow;

  // Vertical position
  const top = showAbove
    ? anchorRect.top - popoverHeight - gap
    : anchorRect.bottom + gap;

  // Horizontal position - center on anchor but keep within viewport
  let left = anchorRect.left + anchorRect.width / 2;
  const halfWidth = popoverWidth / 2;
  if (left - halfWidth < 8) {
    left = halfWidth + 8;
  } else if (left + halfWidth > viewportWidth - 8) {
    left = viewportWidth - halfWidth - 8;
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${left}px`,
        top: `${Math.max(8, top)}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="w-80 rounded-lg border border-border bg-card p-3 shadow-xl">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          className="mb-2 min-h-[80px] w-full resize-none rounded border border-border bg-background p-2 text-sm focus:border-primary focus:outline-none"
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ⌘+Enter to save, Esc to cancel
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingAnnotation(null)}
              className="rounded px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
