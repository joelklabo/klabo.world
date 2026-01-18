'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';
import type { Selector, TextQuoteSelector, TextPositionSelector } from './types';

// Get text context around selection
function getTextContext(text: string, start: number, end: number, contextLength = 50) {
  const prefix = text.slice(Math.max(0, start - contextLength), start);
  const suffix = text.slice(end, Math.min(text.length, end + contextLength));
  return { prefix, suffix };
}

// Build multi-selector from selection
function buildSelectors(
  selection: Selection,
  containerEl: HTMLElement
): { selectors: Selector[]; anchorRect: DOMRect } | null {
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;

  // Check if selection is within the container
  if (!containerEl.contains(range.commonAncestorContainer)) return null;

  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const selectors: Selector[] = [];

  // TextQuoteSelector - most robust
  const fullText = containerEl.textContent || '';
  const startOffset = getTextOffset(containerEl, range.startContainer, range.startOffset);
  const endOffset = startOffset + selectedText.length;
  const { prefix, suffix } = getTextContext(fullText, startOffset, endOffset);

  const quoteSelector: TextQuoteSelector = {
    type: 'TextQuoteSelector',
    exact: selectedText,
    prefix: prefix || undefined,
    suffix: suffix || undefined,
  };
  selectors.push(quoteSelector);

  // TextPositionSelector - fast but fragile
  const positionSelector: TextPositionSelector = {
    type: 'TextPositionSelector',
    start: startOffset,
    end: endOffset,
  };
  selectors.push(positionSelector);

  // Get anchor rect for popover positioning
  const anchorRect = range.getBoundingClientRect();

  return { selectors, anchorRect };
}

// Calculate text offset from container start
function getTextOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let textOffset = 0;

  while (walker.nextNode()) {
    if (walker.currentNode === node) {
      return textOffset + offset;
    }
    textOffset += walker.currentNode.textContent?.length || 0;
  }

  return textOffset;
}

type Props = {
  contentRef: React.RefObject<HTMLElement | null>;
};

export function TextSelectionHandler({ contentRef }: Props) {
  const { mode, setPendingAnnotation } = useAnnotationMode();
  const isSelecting = useRef(false);

  const handleMouseUp = useCallback(() => {
    if (mode !== 'comment') return;
    if (!contentRef.current) return;

    // Small delay to let selection settle
    requestAnimationFrame(() => {
      const selection = globalThis.getSelection();
      if (!selection || selection.isCollapsed) {
        isSelecting.current = false;
        return;
      }

      const result = buildSelectors(selection, contentRef.current!);
      if (result) {
        setPendingAnnotation({
          type: 'TEXT_HIGHLIGHT',
          selectors: result.selectors,
          anchorRect: result.anchorRect,
        });
      }

      isSelecting.current = false;
    });
  }, [mode, contentRef, setPendingAnnotation]);

  const handleMouseDown = useCallback(() => {
    if (mode === 'comment') {
      isSelecting.current = true;
      setPendingAnnotation(null);
    }
  }, [mode, setPendingAnnotation]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.addEventListener('mouseup', handleMouseUp);
    content.addEventListener('mousedown', handleMouseDown);

    return () => {
      content.removeEventListener('mouseup', handleMouseUp);
      content.removeEventListener('mousedown', handleMouseDown);
    };
  }, [contentRef, handleMouseUp, handleMouseDown]);

  return null;
}
