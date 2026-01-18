import { z } from 'zod';
export declare const DraftStatus: {
    readonly DRAFT: "draft";
    readonly PUBLISHED: "published";
};
export type DraftStatus = (typeof DraftStatus)[keyof typeof DraftStatus];
export declare const draftInputSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    body: z.ZodString;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    featuredImage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publishDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lightningAddress: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    nostrPubkey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nostrRelays: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    nostrstackEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type DraftInput = z.infer<typeof draftInputSchema>;
export type DraftMetadata = {
    slug: string;
    title: string;
    summary: string;
    status: DraftStatus;
    date: string;
    publishDate: string | null;
    tags: string[];
    featuredImage: string | null;
    lightningAddress: string | null;
    nostrPubkey: string | null;
    nostrRelays: string[];
    nostrstackEnabled: boolean;
    filePath: string;
};
export type Draft = DraftMetadata & {
    body: string;
};
export type ApiResponse<T> = {
    success: true;
    data: T;
    nextActions?: NextAction[];
} | {
    success: false;
    error: ApiError;
    recovery?: NextAction[];
};
export type NextAction = {
    action: string;
    description: string;
};
export type ApiError = {
    code: string;
    message: string;
    details?: Record<string, unknown>;
};
export type CreateDraftResult = {
    slug: string;
    filePath: string;
    previewUrl: string;
};
export type UpdateDraftResult = {
    slug: string;
    filePath: string;
    previewUrl: string;
};
export type PublishDraftResult = {
    slug: string;
    filePath: string;
    url: string;
    publishDate: string;
};
export type ListDraftsResult = {
    drafts: DraftMetadata[];
    total: number;
};
export type DeleteDraftResult = {
    slug: string;
    deleted: boolean;
};
export type ImageUploadInput = {
    file: Buffer;
    filename: string;
    mimeType: string;
    altText?: string;
};
export type ImageUploadResult = {
    filename: string;
    url: string;
    markdown: string;
    storage: 'local' | 'azure';
    size: number;
};
