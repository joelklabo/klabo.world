import { z } from 'zod';
export declare const AnnotationStatus: {
    readonly OPEN: "OPEN";
    readonly RESOLVED: "RESOLVED";
    readonly ARCHIVED: "ARCHIVED";
};
export type AnnotationStatus = (typeof AnnotationStatus)[keyof typeof AnnotationStatus];
export declare const AnnotationType: {
    readonly TEXT_HIGHLIGHT: "TEXT_HIGHLIGHT";
    readonly RECTANGLE: "RECTANGLE";
    readonly POINT: "POINT";
};
export type AnnotationType = (typeof AnnotationType)[keyof typeof AnnotationType];
export declare const textQuoteSelectorSchema: z.ZodObject<{
    type: z.ZodLiteral<"TextQuoteSelector">;
    exact: z.ZodString;
    prefix: z.ZodOptional<z.ZodString>;
    suffix: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const textPositionSelectorSchema: z.ZodObject<{
    type: z.ZodLiteral<"TextPositionSelector">;
    start: z.ZodNumber;
    end: z.ZodNumber;
}, z.core.$strip>;
export declare const xpathSelectorSchema: z.ZodObject<{
    type: z.ZodLiteral<"XPathSelector">;
    value: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const rectangleSelectorSchema: z.ZodObject<{
    type: z.ZodLiteral<"RectangleSelector">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    pageWidth: z.ZodNumber;
    pageHeight: z.ZodNumber;
}, z.core.$strip>;
export declare const pointSelectorSchema: z.ZodObject<{
    type: z.ZodLiteral<"PointSelector">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    pageWidth: z.ZodNumber;
    pageHeight: z.ZodNumber;
}, z.core.$strip>;
export declare const selectorSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"TextQuoteSelector">;
    exact: z.ZodString;
    prefix: z.ZodOptional<z.ZodString>;
    suffix: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"TextPositionSelector">;
    start: z.ZodNumber;
    end: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"XPathSelector">;
    value: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"RectangleSelector">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    pageWidth: z.ZodNumber;
    pageHeight: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"PointSelector">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    pageWidth: z.ZodNumber;
    pageHeight: z.ZodNumber;
}, z.core.$strip>], "type">;
export type Selector = z.infer<typeof selectorSchema>;
export declare const annotationInputSchema: z.ZodObject<{
    draftSlug: z.ZodString;
    type: z.ZodEnum<{
        TEXT_HIGHLIGHT: "TEXT_HIGHLIGHT";
        RECTANGLE: "RECTANGLE";
        POINT: "POINT";
    }>;
    content: z.ZodString;
    selectors: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"TextQuoteSelector">;
        exact: z.ZodString;
        prefix: z.ZodOptional<z.ZodString>;
        suffix: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"TextPositionSelector">;
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"XPathSelector">;
        value: z.ZodString;
        offset: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"RectangleSelector">;
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        pageWidth: z.ZodNumber;
        pageHeight: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"PointSelector">;
        x: z.ZodNumber;
        y: z.ZodNumber;
        pageWidth: z.ZodNumber;
        pageHeight: z.ZodNumber;
    }, z.core.$strip>], "type">>;
    color: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AnnotationInput = z.infer<typeof annotationInputSchema>;
export declare const annotationUpdateSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED: "RESOLVED";
        ARCHIVED: "ARCHIVED";
    }>>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AnnotationUpdate = z.infer<typeof annotationUpdateSchema>;
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
export type Annotation = AnnotationMetadata & {
    replies: AnnotationMetadata[];
};
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
export type { ApiResponse, ApiError } from '../drafts/types.js';
