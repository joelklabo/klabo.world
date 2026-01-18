import { z } from 'zod';
// Annotation status enum
export const AnnotationStatus = {
    OPEN: 'OPEN',
    RESOLVED: 'RESOLVED',
    ARCHIVED: 'ARCHIVED',
};
// Annotation type enum
export const AnnotationType = {
    TEXT_HIGHLIGHT: 'TEXT_HIGHLIGHT',
    RECTANGLE: 'RECTANGLE',
    POINT: 'POINT',
};
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
// Annotation input validation
export const annotationInputSchema = z.object({
    draftSlug: z.string().min(1, 'Draft slug is required'),
    type: z.enum(['TEXT_HIGHLIGHT', 'RECTANGLE', 'POINT']),
    content: z.string().min(1, 'Comment content is required'),
    selectors: z.array(selectorSchema).min(1, 'At least one selector is required'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    parentId: z.string().optional(),
});
// Annotation update input
export const annotationUpdateSchema = z.object({
    content: z.string().min(1).optional(),
    status: z.enum(['OPEN', 'RESOLVED', 'ARCHIVED']).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
