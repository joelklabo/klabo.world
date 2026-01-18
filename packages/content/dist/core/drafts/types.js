import { z } from 'zod';
// Draft status enum
export const DraftStatus = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
};
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
