import { z } from 'zod';

// Draft status enum
export const DraftStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type DraftStatus = (typeof DraftStatus)[keyof typeof DraftStatus];

// Zod schema for draft input validation
export const draftInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  summary: z.string().min(1, 'Summary is required').max(500),
  body: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
  featuredImage: z.string().url().optional().nullable(),
  publishDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional()
    .nullable(),
  lightningAddress: z.string().email().optional().nullable().or(z.literal('')),
  nostrPubkey: z.string().optional().nullable(),
  nostrRelays: z.array(z.string().url()).optional().default([]),
  nostrstackEnabled: z.boolean().optional().default(true),
});

export type DraftInput = z.infer<typeof draftInputSchema>;

// Draft metadata (without body)
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

// Full draft with body content
export type Draft = DraftMetadata & {
  body: string;
};

// API response wrapper for CLI/MCP
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

// Operation result types
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

// Image upload types
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
