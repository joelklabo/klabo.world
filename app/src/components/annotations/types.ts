// Annotation types for the UI

export type AnnotationStatus = 'OPEN' | 'RESOLVED' | 'ARCHIVED';
export type AnnotationType = 'TEXT_HIGHLIGHT' | 'RECTANGLE' | 'POINT';
export type AnnotationMode = 'view' | 'comment' | 'draw';

// Selector types for robust anchoring
export type TextQuoteSelector = {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
};

export type TextPositionSelector = {
  type: 'TextPositionSelector';
  start: number;
  end: number;
};

export type XPathSelector = {
  type: 'XPathSelector';
  value: string;
  offset?: number;
};

export type RectangleSelector = {
  type: 'RectangleSelector';
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
};

export type PointSelector = {
  type: 'PointSelector';
  x: number;
  y: number;
  pageWidth: number;
  pageHeight: number;
};

export type Selector =
  | TextQuoteSelector
  | TextPositionSelector
  | XPathSelector
  | RectangleSelector
  | PointSelector;

// Annotation data
export type Annotation = {
  id: string;
  draftSlug: string;
  type: AnnotationType;
  status: AnnotationStatus;
  content: string;
  selectors: Selector[];
  color: string | null;
  pinNumber: number | null;
  parentId: string | null;
  depth: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  authorId: string | null;
  replies?: Annotation[];
};

// API response types
export type AnnotationListResponse = {
  annotations: Annotation[];
  counts: {
    open: number;
    resolved: number;
    archived: number;
    total: number;
  };
};

// Selection state for creating new annotations
export type PendingAnnotation = {
  type: AnnotationType;
  selectors: Selector[];
  anchorRect?: DOMRect;
};
