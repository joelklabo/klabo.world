import { z } from 'zod';

// Annotation status enum
export const AnnotationStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AnnotationStatus = (typeof AnnotationStatus)[keyof typeof AnnotationStatus];

// Annotation type enum
export const AnnotationType = {
  TEXT_HIGHLIGHT: 'TEXT_HIGHLIGHT',
  RECTANGLE: 'RECTANGLE',
  POINT: 'POINT',
} as const;

export type AnnotationType = (typeof AnnotationType)[keyof typeof AnnotationType];

// Selector types for robust anchoring
export const textQuoteSelectorSchema = z.object({
  type: z.literal('TextQuoteSelector'),
  exact: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

export const textPositionSelectorSchema = z.object({
  type: z.literal('TextPositionSelector'),
  start: z.number(),
  end: z.number(),
});

export const xpathSelectorSchema = z.object({
  type: z.literal('XPathSelector'),
  value: z.string(),
  offset: z.number().optional(),
});

export const rectangleSelectorSchema = z.object({
  type: z.literal('RectangleSelector'),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  pageWidth: z.number(),
  pageHeight: z.number(),
});

export const pointSelectorSchema = z.object({
  type: z.literal('PointSelector'),
  x: z.number(),
  y: z.number(),
  pageWidth: z.number(),
  pageHeight: z.number(),
});

export const selectorSchema = z.discriminatedUnion('type', [
  textQuoteSelectorSchema,
  textPositionSelectorSchema,
  xpathSelectorSchema,
  rectangleSelectorSchema,
  pointSelectorSchema,
]);

export type Selector = z.infer<typeof selectorSchema>;

// Annotation input validation
export const annotationInputSchema = z.object({
  draftSlug: z.string().min(1, 'Draft slug is required'),
  type: z.enum(['TEXT_HIGHLIGHT', 'RECTANGLE', 'POINT']),
  content: z.string().min(1, 'Comment content is required'),
  selectors: z.array(selectorSchema).min(1, 'At least one selector is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  parentId: z.string().optional(),
});

export type AnnotationInput = z.infer<typeof annotationInputSchema>;

// Annotation update input
export const annotationUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'RESOLVED', 'ARCHIVED']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type AnnotationUpdate = z.infer<typeof annotationUpdateSchema>;

// Annotation metadata (without replies)
export type AnnotationMetadata = {
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
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  authorId: string | null;
};

// Full annotation with replies
export type Annotation = AnnotationMetadata & {
  replies: AnnotationMetadata[];
};

// API response types
export type CreateAnnotationResult = {
  id: string;
  pinNumber: number;
  draftSlug: string;
};

export type UpdateAnnotationResult = {
  id: string;
  status: AnnotationStatus;
};

export type ResolveAnnotationResult = {
  id: string;
  resolvedAt: Date;
  repliesResolved: number;
};

export type DeleteAnnotationResult = {
  id: string;
  deleted: boolean;
  repliesDeleted: number;
};

export type ListAnnotationsResult = {
  annotations: AnnotationMetadata[];
  counts: {
    open: number;
    resolved: number;
    archived: number;
    total: number;
  };
};

// Re-export API types from drafts for consistency
export type { ApiResponse, ApiError } from '../drafts/types.js';
