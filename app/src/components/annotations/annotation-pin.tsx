'use client';

import { useEffect, useState, useRef } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';
import type { Annotation, TextQuoteSelector } from './types';

type PinPosition = {
  top: number;
  left: number;
};

// Find the position for a pin based on the annotation's first selector
function findPinPosition(
  container: HTMLElement,
  annotation: Annotation
): PinPosition | null {
  // For text highlights, find the first character position
  if (annotation.type === 'TEXT_HIGHLIGHT') {
    const quoteSelector = annotation.selectors.find(
      (s): s is TextQuoteSelector => s.type === 'TextQuoteSelector'
    );

    if (!quoteSelector) return null;

    const fullText = container.textContent || '';
    let searchStart = 0;

    if (quoteSelector.prefix) {
      const prefixIndex = fullText.indexOf(quoteSelector.prefix);
      if (prefixIndex !== -1) {
        searchStart = prefixIndex + quoteSelector.prefix.length;
      }
    }

    const exactIndex = fullText.indexOf(quoteSelector.exact, searchStart);
    if (exactIndex === -1) return null;

    // Find the DOM position
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentIndex = 0;
    const containerRect = container.getBoundingClientRect();

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const nodeLength = textNode.textContent?.length || 0;
      const nodeEnd = currentIndex + nodeLength;

      if (nodeEnd > exactIndex) {
        const range = document.createRange();
        const offset = exactIndex - currentIndex;
        range.setStart(textNode, offset);
        range.setEnd(textNode, offset + 1);

        const rect = range.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top - 12, // Position above the text
          left: rect.left - containerRect.left - 8, // Slightly to the left
        };
      }

      currentIndex = nodeEnd;
    }
  }

  // For rectangle/point annotations, use the selector coordinates
  const rectSelector = annotation.selectors.find((s) => s.type === 'RectangleSelector');
  if (rectSelector && rectSelector.type === 'RectangleSelector') {
    const containerRect = container.getBoundingClientRect();
    const scaleX = containerRect.width / rectSelector.pageWidth;
    const scaleY = containerRect.height / rectSelector.pageHeight;

    return {
      top: rectSelector.y * scaleY - 12,
      left: rectSelector.x * scaleX - 8,
    };
  }

  return null;
}

type Props = {
  contentRef: React.RefObject<HTMLElement | null>;
};

export function AnnotationPins({ contentRef }: Props) {
  const { annotations, selectedId, selectAnnotation, showResolved, mode } = useAnnotationMode();
  const [pins, setPins] = useState<
    Map<string, { annotation: Annotation; position: PinPosition }>
  >(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const calculatePins = () => {
      const newPins = new Map<string, { annotation: Annotation; position: PinPosition }>();

      for (const annotation of annotations) {
        // Skip if no pin number (replies don't have pins)
        if (!annotation.pinNumber) continue;

        // Skip resolved unless showing them
        if (!showResolved && annotation.status !== 'OPEN') continue;

        const position = findPinPosition(container, annotation);
        if (position) {
          newPins.set(annotation.id, { annotation, position });
        }
      }

      setPins(newPins);
    };

    calculatePins();

    observerRef.current = new ResizeObserver(calculatePins);
    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [annotations, contentRef, showResolved]);

  // Hide pins in comment/draw mode
  if (mode !== 'view') return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {[...pins.entries()].map(([id, { annotation, position }]) => {
        const isSelected = selectedId === id;
        const isResolved = annotation.status === 'RESOLVED';
        const color = annotation.color || '#3b82f6';

        return (
          <button
            key={id}
            type="button"
            className={`
              pointer-events-auto absolute flex size-7 items-center justify-center
              rounded-full text-xs font-bold shadow-md transition-transform
              ${isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}
              ${isResolved ? 'opacity-50' : ''}
            `}
            style={{
              top: position.top,
              left: position.left,
              backgroundColor: color,
              color: 'white',
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectAnnotation(id);
            }}
          >
            {annotation.pinNumber}
          </button>
        );
      })}
    </div>
  );
}
