// MCP Server for klabo.world content management
// This module provides Model Context Protocol tools for managing blog drafts and annotations
import * as path from 'node:path';
import * as fsSync from 'node:fs';
import { createDraft, updateDraft, getDraft, listDrafts, deleteDraft, publishDraft, } from '../core/drafts/index.js';
import { uploadImage } from '../core/images/index.js';
import { LocalStorageProvider } from '../core/storage/local.js';
import { createAnnotation, listAnnotations, getAnnotation, updateAnnotation, resolveAnnotation, deleteAnnotation, createAnnotationAdapter, } from '../core/annotations/index.js';
// Tool definitions for MCP
export const toolDefinitions = [
    {
        name: 'kw_draft_create',
        description: 'Create a new blog post draft. Returns the slug and preview URL.',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Post title (required)' },
                summary: { type: 'string', description: 'Post summary (required)' },
                body: { type: 'string', description: 'Markdown content (required)' },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for the post',
                },
                featuredImage: { type: 'string', description: 'URL of featured image' },
            },
            required: ['title', 'summary', 'body'],
        },
    },
    {
        name: 'kw_draft_update',
        description: 'Update an existing draft. Only provided fields are updated.',
        inputSchema: {
            type: 'object',
            properties: {
                slug: { type: 'string', description: 'Draft slug to update (required)' },
                title: { type: 'string', description: 'New title' },
                summary: { type: 'string', description: 'New summary' },
                body: { type: 'string', description: 'New markdown content' },
                tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
                featuredImage: { type: 'string', description: 'New featured image URL' },
            },
            required: ['slug'],
        },
    },
    {
        name: 'kw_draft_get',
        description: 'Get a draft by slug, including its full content.',
        inputSchema: {
            type: 'object',
            properties: {
                slug: { type: 'string', description: 'Draft slug (required)' },
            },
            required: ['slug'],
        },
    },
    {
        name: 'kw_draft_list',
        description: 'List all drafts with their metadata (not including body content).',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'kw_draft_delete',
        description: 'Delete a draft. Cannot delete published posts.',
        inputSchema: {
            type: 'object',
            properties: {
                slug: { type: 'string', description: 'Draft slug to delete (required)' },
            },
            required: ['slug'],
        },
    },
    {
        name: 'kw_draft_publish',
        description: 'Publish a draft, making it visible on the public site.',
        inputSchema: {
            type: 'object',
            properties: {
                slug: { type: 'string', description: 'Draft slug to publish (required)' },
                publishDate: {
                    type: 'string',
                    description: 'Publish date in YYYY-MM-DD format (defaults to today)',
                },
            },
            required: ['slug'],
        },
    },
    {
        name: 'kw_image_upload',
        description: 'Upload an image and get the markdown syntax to embed it.',
        inputSchema: {
            type: 'object',
            properties: {
                data: {
                    type: 'string',
                    description: 'Base64-encoded image data (required)',
                },
                filename: {
                    type: 'string',
                    description: 'Filename with extension, e.g., "hero.png" (required)',
                },
                altText: {
                    type: 'string',
                    description: 'Alt text for the image',
                },
            },
            required: ['data', 'filename'],
        },
    },
    // Annotation tools
    {
        name: 'kw_annotation_list',
        description: 'List all annotations for a draft with status counts. Returns open, resolved, and archived counts.',
        inputSchema: {
            type: 'object',
            properties: {
                draftSlug: {
                    type: 'string',
                    description: 'The draft slug to list annotations for (required)',
                },
                status: {
                    type: 'string',
                    enum: ['OPEN', 'RESOLVED', 'ARCHIVED'],
                    description: 'Filter by status (optional)',
                },
            },
            required: ['draftSlug'],
        },
    },
    {
        name: 'kw_annotation_get',
        description: 'Get a single annotation with its thread replies.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'The annotation ID (required)',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'kw_annotation_create',
        description: 'Create a new annotation on a draft. Claude can use this to annotate content for the user.',
        inputSchema: {
            type: 'object',
            properties: {
                draftSlug: {
                    type: 'string',
                    description: 'The draft slug to annotate (required)',
                },
                type: {
                    type: 'string',
                    enum: ['TEXT_HIGHLIGHT', 'RECTANGLE', 'POINT'],
                    description: 'Annotation type (required)',
                },
                content: {
                    type: 'string',
                    description: 'Comment/feedback text (required)',
                },
                selectors: {
                    type: 'array',
                    description: 'Array of selector objects to anchor the annotation (required)',
                    items: {
                        type: 'object',
                    },
                },
                color: {
                    type: 'string',
                    description: 'Hex color code (optional, defaults to #3b82f6)',
                },
                parentId: {
                    type: 'string',
                    description: 'Parent annotation ID for replies (optional)',
                },
            },
            required: ['draftSlug', 'type', 'content', 'selectors'],
        },
    },
    {
        name: 'kw_annotation_update',
        description: 'Update an annotation content, status, or color.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'The annotation ID (required)',
                },
                content: {
                    type: 'string',
                    description: 'New comment text (optional)',
                },
                status: {
                    type: 'string',
                    enum: ['OPEN', 'RESOLVED', 'ARCHIVED'],
                    description: 'New status (optional)',
                },
                color: {
                    type: 'string',
                    description: 'New hex color code (optional)',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'kw_annotation_resolve',
        description: 'Resolve an annotation and all its replies. Use after addressing feedback.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'The annotation ID to resolve (required)',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'kw_annotation_delete',
        description: 'Delete an annotation and all its replies.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'The annotation ID to delete (required)',
                },
            },
            required: ['id'],
        },
    },
];
// Resolve project configuration
function resolveConfig() {
    // Find project root
    let dir = process.cwd();
    while (dir !== '/') {
        try {
            const pkgPath = path.join(dir, 'package.json');
            const pkgContent = fsSync.readFileSync(pkgPath, 'utf-8');
            const pkg = JSON.parse(pkgContent);
            if (pkg.name === 'klaboworld-monorepo') {
                break;
            }
        }
        catch {
            // Keep looking
        }
        dir = path.dirname(dir);
    }
    const contentDir = path.join(dir, 'content', 'posts');
    const uploadsDir = path.join(dir, 'app', 'public', 'uploads');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return {
        draft: { contentDir, baseUrl },
        image: { uploadsDir, baseUrl },
        storage: new LocalStorageProvider(dir),
    };
}
async function handleTool(name, input) {
    const { draft: draftConfig, image: imageConfig, storage } = resolveConfig();
    try {
        switch (name) {
            case 'kw_draft_create': {
                const draftInput = {
                    title: input.title,
                    summary: input.summary,
                    body: input.body,
                    tags: input.tags || [],
                    featuredImage: input.featuredImage || null,
                    nostrRelays: [],
                    nostrstackEnabled: true,
                };
                const result = await createDraft(draftInput, storage, draftConfig);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                data: result,
                                nextActions: [
                                    `Preview at: ${result.previewUrl}`,
                                    `Update: kw_draft_update with slug "${result.slug}"`,
                                    `Publish: kw_draft_publish with slug "${result.slug}"`,
                                ],
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_draft_update': {
                const partialInput = {};
                if (input.title)
                    partialInput.title = input.title;
                if (input.summary)
                    partialInput.summary = input.summary;
                if (input.body)
                    partialInput.body = input.body;
                if (input.tags)
                    partialInput.tags = input.tags;
                if (input.featuredImage)
                    partialInput.featuredImage = input.featuredImage;
                const result = await updateDraft(input.slug, partialInput, storage, draftConfig);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, data: result }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_draft_get': {
                const result = await getDraft(input.slug, storage, draftConfig);
                if (!result) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: false,
                                    error: { code: 'NOT_FOUND', message: `Draft not found: ${input.slug}` },
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, data: result }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_draft_list': {
                const result = await listDrafts(storage, draftConfig);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, data: result }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_draft_delete': {
                const result = await deleteDraft(input.slug, storage, draftConfig);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ success: true, data: result }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_draft_publish': {
                const result = await publishDraft(input.slug, storage, draftConfig, {
                    publishDate: input.publishDate,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                data: result,
                                nextActions: [`View published post at: ${result.url}`],
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'kw_image_upload': {
                const data = input.data;
                const filename = input.filename;
                const altText = input.altText;
                // Decode base64
                const buffer = Buffer.from(data, 'base64');
                // Determine MIME type from filename
                const ext = path.extname(filename).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                };
                const mimeType = mimeTypes[ext];
                if (!mimeType) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: false,
                                    error: {
                                        code: 'UNSUPPORTED_TYPE',
                                        message: `Unsupported image type: ${ext}`,
                                    },
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
                const result = await uploadImage({ file: buffer, filename, mimeType, altText }, imageConfig);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                data: result,
                                hint: `Use this markdown to embed: ${result.markdown}`,
                            }, null, 2),
                        },
                    ],
                };
            }
            // Annotation tool handlers
            case 'kw_annotation_list': {
                const db = createAnnotationAdapter();
                try {
                    const result = await listAnnotations(input.draftSlug, db, input.status ? { status: input.status } : undefined);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    data: result,
                                    summary: `Found ${result.counts.total} annotations: ${result.counts.open} open, ${result.counts.resolved} resolved, ${result.counts.archived} archived`,
                                }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            case 'kw_annotation_get': {
                const db = createAnnotationAdapter();
                try {
                    const result = await getAnnotation(input.id, db);
                    if (!result) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        error: { code: 'NOT_FOUND', message: `Annotation not found: ${input.id}` },
                                    }),
                                },
                            ],
                            isError: true,
                        };
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ success: true, data: result }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            case 'kw_annotation_create': {
                const db = createAnnotationAdapter();
                try {
                    const annotationInput = {
                        draftSlug: input.draftSlug,
                        type: input.type,
                        content: input.content,
                        selectors: input.selectors,
                        color: input.color,
                        parentId: input.parentId,
                    };
                    const result = await createAnnotation(annotationInput, db);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    data: result,
                                    nextActions: [
                                        `View annotation: kw_annotation_get with id "${result.id}"`,
                                        `List all annotations: kw_annotation_list with draftSlug "${result.draftSlug}"`,
                                    ],
                                }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            case 'kw_annotation_update': {
                const db = createAnnotationAdapter();
                try {
                    const updateInput = {};
                    if (input.content)
                        updateInput.content = input.content;
                    if (input.status)
                        updateInput.status = input.status;
                    if (input.color)
                        updateInput.color = input.color;
                    const result = await updateAnnotation(input.id, updateInput, db);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({ success: true, data: result }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            case 'kw_annotation_resolve': {
                const db = createAnnotationAdapter();
                try {
                    const result = await resolveAnnotation(input.id, db);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    data: result,
                                    message: `Resolved annotation and ${result.repliesResolved} replies`,
                                }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            case 'kw_annotation_delete': {
                const db = createAnnotationAdapter();
                try {
                    const result = await deleteAnnotation(input.id, db);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    data: result,
                                    message: `Deleted annotation and ${result.repliesDeleted} replies`,
                                }, null, 2),
                            },
                        ],
                    };
                }
                finally {
                    db.close();
                }
            }
            default:
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: { code: 'UNKNOWN_TOOL', message: `Unknown tool: ${name}` },
                            }),
                        },
                    ],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: {
                            code: 'EXECUTION_ERROR',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        },
                    }),
                },
            ],
            isError: true,
        };
    }
}
// Export for MCP server setup
export { toolDefinitions as tools, handleTool };
