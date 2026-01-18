'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnnotationMode } from './annotation-mode-provider';
import type { RectangleSelector } from './types';

type DrawingRect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type Props = {
  contentRef: React.RefObject<HTMLElement | null>;
};

export function AnnotationOverlay({ contentRef }: Props) {
  const { mode, setPendingAnnotation, annotations, selectedId, selectAnnotation, showResolved } =
    useAnnotationMode();
  const [drawing, setDrawing] = useState<DrawingRect | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Update dimensions when content changes
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => observer.disconnect();
  }, [contentRef]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'draw') return;
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDrawing({ startX: x, startY: y, endX: x, endY: y });
      setPendingAnnotation(null);
    },
    [mode, setPendingAnnotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing || mode !== 'draw') return;
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDrawing((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
    },
    [drawing, mode]
  );

  const handleMouseUp = useCallback(() => {
    if (!drawing || mode !== 'draw') return;
    if (!svgRef.current) return;

    // Calculate rectangle bounds (SVG-relative)
    const x = Math.min(drawing.startX, drawing.endX);
    const y = Math.min(drawing.startY, drawing.endY);
    const width = Math.abs(drawing.endX - drawing.startX);
    const height = Math.abs(drawing.endY - drawing.startY);

    // Only create if large enough
    if (width > 10 && height > 10) {
      const selector: RectangleSelector = {
        type: 'RectangleSelector',
        x,
        y,
        width,
        height,
        pageWidth: dimensions.width,
        pageHeight: dimensions.height,
      };

      // Convert to viewport coordinates for popover positioning
      const svgRect = svgRef.current.getBoundingClientRect();
      const viewportX = x + svgRect.left;
      const viewportY = y + svgRect.top;

      setPendingAnnotation({
        type: 'RECTANGLE',
        selectors: [selector],
        anchorRect: new DOMRect(viewportX, viewportY, width, height),
      });
    }

    setDrawing(null);
  }, [drawing, mode, dimensions, setPendingAnnotation]);

  // Get existing rectangle annotations
  const rectangleAnnotations = annotations.filter(
    (a) =>
      a.type === 'RECTANGLE' &&
      (showResolved || a.status === 'OPEN') &&
      a.selectors.some((s) => s.type === 'RectangleSelector')
  );

  // Don't show in comment mode
  if (mode === 'comment') return null;

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 ${mode === 'draw' ? 'z-[100] cursor-crosshair pointer-events-auto' : 'z-10 pointer-events-none'}`}
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Existing rectangle annotations */}
      {rectangleAnnotations.map((annotation) => {
        const rectSelector = annotation.selectors.find(
          (s): s is RectangleSelector => s.type === 'RectangleSelector'
        );
        if (!rectSelector) return null;

        // Scale to current dimensions
        const scaleX = dimensions.width / rectSelector.pageWidth;
        const scaleY = dimensions.height / rectSelector.pageHeight;
        const x = rectSelector.x * scaleX;
        const y = rectSelector.y * scaleY;
        const width = rectSelector.width * scaleX;
        const height = rectSelector.height * scaleY;

        const isSelected = selectedId === annotation.id;
        const isResolved = annotation.status === 'RESOLVED';
        const color = annotation.color || '#3b82f6';

        return (
          <g key={annotation.id}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={color}
              fillOpacity={isResolved ? 0.05 : 0.1}
              stroke={color}
              strokeWidth={isSelected ? 3 : 2}
              strokeOpacity={isResolved ? 0.3 : 0.8}
              rx={4}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                selectAnnotation(annotation.id);
              }}
            />
            {/* Pin number badge */}
            {annotation.pinNumber && (
              <g transform={`translate(${x - 8}, ${y - 8})`}>
                <circle cx={12} cy={12} r={12} fill={color} />
                <text
                  x={12}
                  y={12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={12}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {annotation.pinNumber}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Current drawing */}
      {drawing && (
        <rect
          x={Math.min(drawing.startX, drawing.endX)}
          y={Math.min(drawing.startY, drawing.endY)}
          width={Math.abs(drawing.endX - drawing.startX)}
          height={Math.abs(drawing.endY - drawing.startY)}
          fill="#3b82f6"
          fillOpacity={0.2}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4"
          rx={4}
        />
      )}
    </svg>
  );
}
