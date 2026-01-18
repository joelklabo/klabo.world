'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';
import type { Annotation, TextQuoteSelector } from './types';

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

// Find text in container and return highlight rects
function findTextRects(
  container: HTMLElement,
  selector: TextQuoteSelector
): HighlightRect[] | null {
  const fullText = container.textContent || '';
  let searchStart = 0;

  // If we have prefix, use it to narrow down the search
  if (selector.prefix) {
    const prefixIndex = fullText.indexOf(selector.prefix);
    if (prefixIndex !== -1) {
      searchStart = prefixIndex + selector.prefix.length;
    }
  }

  // Find the exact text
  const exactIndex = fullText.indexOf(selector.exact, searchStart);
  if (exactIndex === -1) return null;

  // Verify suffix if present
  if (selector.suffix) {
    const expectedSuffixIndex = exactIndex + selector.exact.length;
    const actualSuffix = fullText.slice(
      expectedSuffixIndex,
      expectedSuffixIndex + selector.suffix.length
    );
    if (actualSuffix !== selector.suffix) {
      // Try to find elsewhere
      const altIndex = fullText.indexOf(selector.exact, exactIndex + 1);
      if (altIndex !== -1) {
        return findTextRectsAtIndex(container, altIndex, selector.exact.length);
      }
      return null;
    }
  }

  return findTextRectsAtIndex(container, exactIndex, selector.exact.length);
}

// Get DOM rects for text at a specific index
function findTextRectsAtIndex(
  container: HTMLElement,
  startIndex: number,
  length: number
): HighlightRect[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const rects: HighlightRect[] = [];
  let currentIndex = 0;
  const endIndex = startIndex + length;
  const containerRect = container.getBoundingClientRect();

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const nodeLength = textNode.textContent?.length || 0;
    const nodeEnd = currentIndex + nodeLength;

    // Check if this node overlaps with our range
    if (nodeEnd > startIndex && currentIndex < endIndex) {
      const range = document.createRange();
      const rangeStart = Math.max(0, startIndex - currentIndex);
      const rangeEnd = Math.min(nodeLength, endIndex - currentIndex);

      range.setStart(textNode, rangeStart);
      range.setEnd(textNode, rangeEnd);

      const nodeRects = range.getClientRects();
      for (const rect of nodeRects) {
        rects.push({
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    }

    currentIndex = nodeEnd;
    if (currentIndex >= endIndex) break;
  }

  return rects;
}

type Props = {
  contentRef: React.RefObject<HTMLElement | null>;
};

export function AnnotationHighlights({ contentRef }: Props) {
  const { annotations, selectedId, selectAnnotation, showResolved, mode } = useAnnotationMode();
  const [highlights, setHighlights] = useState<
    Map<string, { annotation: Annotation; rects: HighlightRect[] }>
  >(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  const handleHighlightKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    id: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectAnnotation(id);
    }
  };

  // Calculate highlights when annotations or content changes
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const calculateHighlights = () => {
      const newHighlights = new Map<
        string,
        { annotation: Annotation; rects: HighlightRect[] }
      >();

      for (const annotation of annotations) {
        // Skip resolved unless showing them
        if (!showResolved && annotation.status !== 'OPEN') continue;

        // Only process TEXT_HIGHLIGHT annotations
        if (annotation.type !== 'TEXT_HIGHLIGHT') continue;

        // Find TextQuoteSelector
        const quoteSelector = annotation.selectors.find(
          (s): s is TextQuoteSelector => s.type === 'TextQuoteSelector'
        );

        if (quoteSelector) {
          const rects = findTextRects(container, quoteSelector);
          if (rects && rects.length > 0) {
            newHighlights.set(annotation.id, { annotation, rects });
          }
        }
      }

      setHighlights(newHighlights);
    };

    // Initial calculation
    calculateHighlights();

    // Recalculate on resize
    observerRef.current = new ResizeObserver(calculateHighlights);
    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [annotations, contentRef, showResolved]);

  // Don't render highlights when in draw mode
  if (mode === 'draw') return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {[...highlights.entries()].map(([id, { annotation, rects }]) => {
        const isSelected = selectedId === id;
        const isResolved = annotation.status === 'RESOLVED';
        const color = annotation.color || '#3b82f6';

        return rects.map((rect, i) => (
          <div
            key={`${id}-${i}`}
            role="button"
            tabIndex={0}
            className="pointer-events-auto absolute cursor-pointer motion-safe:transition-opacity motion-safe:duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              backgroundColor: color,
              opacity: isResolved ? 0.15 : isSelected ? 0.4 : 0.25,
              borderBottom: `2px solid ${color}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectAnnotation(id);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              handleHighlightKeyDown(e, id);
            }}
          />
        ));
      })}
    </div>
  );
}
