'use client';

import { useRef, type ReactNode } from 'react';
import { AnnotationModeProvider } from './annotation-mode-provider';
import { AnnotationToolbar } from './annotation-toolbar';
import { AnnotationSidebar } from './annotation-sidebar';
import { AnnotationPopover } from './annotation-popover';
import { AnnotationHighlights } from './annotation-highlight';
import { AnnotationPins } from './annotation-pin';
import { AnnotationOverlay } from './annotation-overlay';
import { TextSelectionHandler } from './text-selection-handler';

type Props = {
  draftSlug: string;
  children: ReactNode;
};

export function AnnotatableDraft({ draftSlug, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <AnnotationModeProvider draftSlug={draftSlug}>
      <div className="flex min-h-screen">
        {/* Main content area */}
        <div className="flex-1">
          <AnnotationToolbar />

          {/* Content wrapper with relative positioning for overlays */}
          <div className="relative" ref={contentRef}>
            {/* The actual content */}
            {children}

            {/* Annotation layers */}
            <AnnotationHighlights contentRef={contentRef} />
            <AnnotationPins contentRef={contentRef} />
            <AnnotationOverlay contentRef={contentRef} />
            <TextSelectionHandler contentRef={contentRef} />
          </div>
        </div>

        {/* Sidebar */}
        <AnnotationSidebar />
      </div>

      {/* Popover for comment entry */}
      <AnnotationPopover />
    </AnnotationModeProvider>
  );
}
