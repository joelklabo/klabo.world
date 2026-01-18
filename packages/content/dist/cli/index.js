import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { createDraft, updateDraft, getDraft, listDrafts, deleteDraft, publishDraft, unpublishPost, } from '../core/drafts/index.js';
import { uploadImageFromPath } from '../core/images/index.js';
import { LocalStorageProvider } from '../core/storage/local.js';
// Resolve project paths
function resolveConfig() {
    // Find project root by looking for package.json with name "klaboworld-monorepo"
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
// Output JSON response
function output(response) {
    console.log(JSON.stringify(response, null, 2));
}
// Build next actions for create
function createNextActions(slug) {
    return [
        { action: `kw draft get ${slug}`, description: 'View draft details' },
        { action: `kw draft update ${slug} --body ./updated.md`, description: 'Update draft content' },
        { action: `kw draft publish ${slug}`, description: 'Publish the draft' },
        { action: `kw draft delete ${slug}`, description: 'Delete the draft' },
        { action: `open http://localhost:3000/drafts/${slug}`, description: 'Preview in browser' },
    ];
}
// Build next actions for publish
function publishNextActions(slug) {
    return [
        { action: `open http://localhost:3000/posts/${slug}`, description: 'View published post' },
        { action: `kw draft unpublish ${slug}`, description: 'Unpublish (revert to draft)' },
    ];
}
export function createCli() {
    const program = new Command();
    program
        .name('kw')
        .description('klabo.world content management CLI')
        .version('0.0.1');
    // Draft commands
    const draft = program.command('draft').description('Manage blog post drafts');
    // kw draft create
    draft
        .command('create')
        .description('Create a new draft post')
        .requiredOption('-t, --title <title>', 'Post title')
        .requiredOption('-s, --summary <summary>', 'Post summary')
        .option('-b, --body <file>', 'Path to markdown file for body content')
        .option('--body-stdin', 'Read body content from stdin')
        .option('--tags <tags>', 'Comma-separated tags')
        .option('--featured-image <url>', 'Featured image URL')
        .option('--images <files...>', 'Image files to upload')
        .action(async (options) => {
        try {
            const { draft: draftConfig, image: imageConfig, storage } = resolveConfig();
            // Get body content
            let body = '';
            if (options.bodyStdin) {
                const chunks = [];
                for await (const chunk of process.stdin) {
                    chunks.push(chunk);
                }
                body = Buffer.concat(chunks).toString('utf-8');
            }
            else if (options.body) {
                body = await fs.readFile(options.body, 'utf-8');
            }
            else {
                body = '# ' + options.title + '\n\nStart writing here...';
            }
            // Upload images if provided
            const uploadedImages = [];
            if (options.images) {
                for (const imagePath of options.images) {
                    const result = await uploadImageFromPath(imagePath, imageConfig);
                    uploadedImages.push({
                        source: imagePath,
                        url: result.url,
                        markdown: result.markdown,
                    });
                }
            }
            // Build input
            const input = {
                title: options.title,
                summary: options.summary,
                body,
                tags: options.tags ? options.tags.split(',').map((t) => t.trim()) : [],
                featuredImage: options.featuredImage || null,
                nostrRelays: [],
                nostrstackEnabled: true,
            };
            // Create draft
            const result = await createDraft(input, storage, draftConfig);
            output({
                success: true,
                data: {
                    ...result,
                    images: uploadedImages,
                },
                nextActions: createNextActions(result.slug),
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'CREATE_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                recovery: [
                    { action: 'kw draft list', description: 'List existing drafts' },
                ],
            });
            process.exit(1);
        }
    });
    // kw draft update
    draft
        .command('update <slug>')
        .description('Update an existing draft')
        .option('-t, --title <title>', 'New title')
        .option('-s, --summary <summary>', 'New summary')
        .option('-b, --body <file>', 'Path to markdown file for body content')
        .option('--tags <tags>', 'Comma-separated tags')
        .option('--featured-image <url>', 'Featured image URL')
        .option('--images <files...>', 'Additional image files to upload')
        .action(async (slug, options) => {
        try {
            const { draft: draftConfig, image: imageConfig, storage } = resolveConfig();
            // Build partial input
            const input = {};
            if (options.title)
                input.title = options.title;
            if (options.summary)
                input.summary = options.summary;
            if (options.body)
                input.body = await fs.readFile(options.body, 'utf-8');
            if (options.tags)
                input.tags = options.tags.split(',').map((t) => t.trim());
            if (options.featuredImage)
                input.featuredImage = options.featuredImage;
            // Upload images if provided
            const uploadedImages = [];
            if (options.images) {
                for (const imagePath of options.images) {
                    const result = await uploadImageFromPath(imagePath, imageConfig);
                    uploadedImages.push({
                        source: imagePath,
                        url: result.url,
                        markdown: result.markdown,
                    });
                }
            }
            const result = await updateDraft(slug, input, storage, draftConfig);
            output({
                success: true,
                data: {
                    ...result,
                    images: uploadedImages,
                },
                nextActions: createNextActions(result.slug),
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'UPDATE_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                recovery: [
                    { action: `kw draft get ${slug}`, description: 'Check if draft exists' },
                    { action: 'kw draft list', description: 'List all drafts' },
                ],
            });
            process.exit(1);
        }
    });
    // kw draft get
    draft
        .command('get <slug>')
        .description('Get a draft by slug')
        .action(async (slug) => {
        try {
            const { draft: draftConfig, storage } = resolveConfig();
            const result = await getDraft(slug, storage, draftConfig);
            if (!result) {
                output({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: `Draft not found: ${slug}`,
                    },
                    recovery: [
                        { action: 'kw draft list', description: 'List all drafts' },
                    ],
                });
                process.exit(1);
            }
            output({
                success: true,
                data: result,
                nextActions: createNextActions(slug),
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'GET_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            process.exit(1);
        }
    });
    // kw draft list
    draft
        .command('list')
        .description('List all drafts')
        .action(async () => {
        try {
            const { draft: draftConfig, storage } = resolveConfig();
            const result = await listDrafts(storage, draftConfig);
            output({
                success: true,
                data: result,
                nextActions: [
                    { action: 'kw draft create -t "Title" -s "Summary"', description: 'Create a new draft' },
                ],
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'LIST_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            process.exit(1);
        }
    });
    // kw draft delete
    draft
        .command('delete <slug>')
        .description('Delete a draft')
        .option('-f, --force', 'Skip confirmation')
        .action(async (slug, options) => {
        try {
            const { draft: draftConfig, storage } = resolveConfig();
            // For non-interactive use (LLMs), --force is assumed
            if (!options.force && process.stdin.isTTY) {
                console.error('Use --force to confirm deletion');
                process.exit(1);
            }
            const result = await deleteDraft(slug, storage, draftConfig);
            output({
                success: true,
                data: result,
                nextActions: [
                    { action: 'kw draft list', description: 'List remaining drafts' },
                ],
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'DELETE_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                recovery: [
                    { action: `kw draft get ${slug}`, description: 'Check if draft exists' },
                ],
            });
            process.exit(1);
        }
    });
    // kw draft publish
    draft
        .command('publish <slug>')
        .description('Publish a draft')
        .option('--publish-date <date>', 'Publish date (YYYY-MM-DD)')
        .action(async (slug, options) => {
        try {
            const { draft: draftConfig, storage } = resolveConfig();
            const result = await publishDraft(slug, storage, draftConfig, {
                publishDate: options.publishDate,
            });
            output({
                success: true,
                data: result,
                nextActions: publishNextActions(slug),
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'PUBLISH_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
                recovery: [
                    { action: `kw draft get ${slug}`, description: 'Check draft status' },
                ],
            });
            process.exit(1);
        }
    });
    // kw draft unpublish
    draft
        .command('unpublish <slug>')
        .description('Unpublish a post (revert to draft)')
        .action(async (slug) => {
        try {
            const { draft: draftConfig, storage } = resolveConfig();
            const result = await unpublishPost(slug, storage, draftConfig);
            output({
                success: true,
                data: result,
                nextActions: createNextActions(slug),
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'UNPUBLISH_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            process.exit(1);
        }
    });
    // Image commands
    const image = program.command('image').description('Manage images');
    // kw image upload
    image
        .command('upload <file>')
        .description('Upload an image')
        .option('--alt <text>', 'Alt text for the image')
        .action(async (file, options) => {
        try {
            const { image: imageConfig } = resolveConfig();
            const result = await uploadImageFromPath(file, imageConfig, options.alt);
            output({
                success: true,
                data: result,
                nextActions: [
                    { action: `echo "${result.markdown}"`, description: 'Copy markdown to clipboard' },
                ],
            });
        }
        catch (error) {
            output({
                success: false,
                error: {
                    code: 'UPLOAD_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            process.exit(1);
        }
    });
    return program;
}
