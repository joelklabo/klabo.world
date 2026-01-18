import matter from 'gray-matter';
import slugify from 'slugify';
import { draftInputSchema, DraftStatus, } from './types.js';
// Generate a URL-safe slug from title
export function generateSlug(title) {
    return slugify(title, {
        lower: true,
        strict: true,
        trim: true,
    });
}
// Build MDX frontmatter + content
function buildMarkdown(input, status) {
    const lines = ['---'];
    lines.push(`title: "${input.title.replace(/"/g, '\\"')}"`);
    lines.push(`summary: "${input.summary.replace(/"/g, '\\"')}"`);
    lines.push(`date: ${new Date().toISOString().split('T')[0]}`);
    lines.push(`status: ${status}`);
    if (input.publishDate) {
        lines.push(`publishDate: ${input.publishDate}`);
    }
    if (input.tags && input.tags.length > 0) {
        lines.push(`tags:`);
        for (const tag of input.tags) {
            lines.push(`  - ${tag}`);
        }
    }
    if (input.featuredImage) {
        lines.push(`featuredImage: ${input.featuredImage}`);
    }
    if (input.lightningAddress) {
        lines.push(`lightningAddress: ${input.lightningAddress}`);
    }
    if (input.nostrPubkey) {
        lines.push(`nostrPubkey: ${input.nostrPubkey}`);
    }
    if (input.nostrRelays && input.nostrRelays.length > 0) {
        lines.push(`nostrRelays:`);
        for (const relay of input.nostrRelays) {
            lines.push(`  - ${relay}`);
        }
    }
    if (input.nostrstackEnabled !== undefined) {
        lines.push(`nostrstackEnabled: ${input.nostrstackEnabled}`);
    }
    lines.push('---');
    lines.push('');
    lines.push(input.body);
    return lines.join('\n');
}
// Parse MDX file into Draft object
function parseDraft(content, filePath) {
    const { data, content: body } = matter(content);
    const slug = filePath.replace(/\.mdx$/, '').split('/').pop() || '';
    return {
        slug,
        title: data.title || '',
        summary: data.summary || '',
        status: data.status || DraftStatus.DRAFT,
        date: data.date || new Date().toISOString().split('T')[0],
        publishDate: data.publishDate || null,
        tags: data.tags || [],
        featuredImage: data.featuredImage || null,
        lightningAddress: data.lightningAddress || null,
        nostrPubkey: data.nostrPubkey || null,
        nostrRelays: data.nostrRelays || [],
        nostrstackEnabled: data.nostrstackEnabled ?? true,
        filePath,
        body: body.trim(),
    };
}
// Create a new draft
export async function createDraft(input, storage, config) {
    // Validate input
    const validated = draftInputSchema.parse(input);
    // Generate slug
    const slug = generateSlug(validated.title);
    const filename = `${slug}.mdx`;
    const filePath = `${config.contentDir}/${filename}`;
    // Check for existing file with same slug
    if (await storage.exists(filePath)) {
        // Append number to make unique
        let counter = 2;
        let uniqueSlug = `${slug}-${counter}`;
        let uniquePath = `${config.contentDir}/${uniqueSlug}.mdx`;
        while (await storage.exists(uniquePath)) {
            counter++;
            uniqueSlug = `${slug}-${counter}`;
            uniquePath = `${config.contentDir}/${uniqueSlug}.mdx`;
        }
        const markdown = buildMarkdown(validated, DraftStatus.DRAFT);
        await storage.write(uniquePath, markdown);
        return {
            slug: uniqueSlug,
            filePath: uniquePath,
            previewUrl: `${config.baseUrl}/drafts/${uniqueSlug}`,
        };
    }
    // Write new draft
    const markdown = buildMarkdown(validated, DraftStatus.DRAFT);
    await storage.write(filePath, markdown);
    return {
        slug,
        filePath,
        previewUrl: `${config.baseUrl}/drafts/${slug}`,
    };
}
// Update an existing draft
export async function updateDraft(slug, input, storage, config) {
    const filePath = `${config.contentDir}/${slug}.mdx`;
    // Read existing draft
    if (!(await storage.exists(filePath))) {
        throw new Error(`Draft not found: ${slug}`);
    }
    const existingContent = await storage.read(filePath);
    const existing = parseDraft(existingContent, filePath);
    // Merge with new input
    const merged = {
        title: input.title ?? existing.title,
        summary: input.summary ?? existing.summary,
        body: input.body ?? existing.body,
        tags: input.tags ?? existing.tags,
        featuredImage: input.featuredImage ?? existing.featuredImage,
        publishDate: input.publishDate ?? existing.publishDate,
        lightningAddress: input.lightningAddress ?? existing.lightningAddress,
        nostrPubkey: input.nostrPubkey ?? existing.nostrPubkey,
        nostrRelays: input.nostrRelays ?? existing.nostrRelays,
        nostrstackEnabled: input.nostrstackEnabled ?? existing.nostrstackEnabled,
    };
    // Write updated draft
    const markdown = buildMarkdown(merged, existing.status);
    await storage.write(filePath, markdown);
    return {
        slug,
        filePath,
        previewUrl: `${config.baseUrl}/drafts/${slug}`,
    };
}
// Get a draft by slug
export async function getDraft(slug, storage, config) {
    const filePath = `${config.contentDir}/${slug}.mdx`;
    if (!(await storage.exists(filePath))) {
        return null;
    }
    const content = await storage.read(filePath);
    return parseDraft(content, filePath);
}
// List all drafts
export async function listDrafts(storage, config) {
    const files = await storage.list(config.contentDir);
    const drafts = [];
    for (const filename of files) {
        const filePath = `${config.contentDir}/${filename}`;
        const content = await storage.read(filePath);
        const draft = parseDraft(content, filePath);
        // Only include actual drafts (status: draft)
        if (draft.status === DraftStatus.DRAFT) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { body, ...metadata } = draft;
            drafts.push(metadata);
        }
    }
    // Sort by date descending
    drafts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
        drafts,
        total: drafts.length,
    };
}
// Delete a draft
export async function deleteDraft(slug, storage, config) {
    const filePath = `${config.contentDir}/${slug}.mdx`;
    if (!(await storage.exists(filePath))) {
        throw new Error(`Draft not found: ${slug}`);
    }
    // Verify it's actually a draft before deleting
    const content = await storage.read(filePath);
    const draft = parseDraft(content, filePath);
    if (draft.status !== DraftStatus.DRAFT) {
        throw new Error(`Cannot delete published post: ${slug}. Use unpublish first.`);
    }
    await storage.delete(filePath);
    return {
        slug,
        deleted: true,
    };
}
// Publish a draft (change status to published)
export async function publishDraft(slug, storage, config, options) {
    const filePath = `${config.contentDir}/${slug}.mdx`;
    if (!(await storage.exists(filePath))) {
        throw new Error(`Draft not found: ${slug}`);
    }
    const content = await storage.read(filePath);
    const draft = parseDraft(content, filePath);
    if (draft.status === DraftStatus.PUBLISHED) {
        throw new Error(`Post is already published: ${slug}`);
    }
    // Build published version
    const publishDate = options?.publishDate || new Date().toISOString().split('T')[0];
    const publishedInput = {
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        tags: draft.tags,
        featuredImage: draft.featuredImage,
        publishDate,
        lightningAddress: draft.lightningAddress,
        nostrPubkey: draft.nostrPubkey,
        nostrRelays: draft.nostrRelays,
        nostrstackEnabled: draft.nostrstackEnabled,
    };
    const markdown = buildMarkdown(publishedInput, DraftStatus.PUBLISHED);
    await storage.write(filePath, markdown);
    return {
        slug,
        filePath,
        url: `${config.baseUrl}/posts/${slug}`,
        publishDate,
    };
}
// Unpublish a post (change status back to draft)
export async function unpublishPost(slug, storage, config) {
    const filePath = `${config.contentDir}/${slug}.mdx`;
    if (!(await storage.exists(filePath))) {
        throw new Error(`Post not found: ${slug}`);
    }
    const content = await storage.read(filePath);
    const draft = parseDraft(content, filePath);
    if (draft.status === DraftStatus.DRAFT) {
        throw new Error(`Post is already a draft: ${slug}`);
    }
    // Build draft version
    const draftInput = {
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        tags: draft.tags,
        featuredImage: draft.featuredImage,
        publishDate: null,
        lightningAddress: draft.lightningAddress,
        nostrPubkey: draft.nostrPubkey,
        nostrRelays: draft.nostrRelays,
        nostrstackEnabled: draft.nostrstackEnabled,
    };
    const markdown = buildMarkdown(draftInput, DraftStatus.DRAFT);
    await storage.write(filePath, markdown);
    return {
        slug,
        filePath,
        previewUrl: `${config.baseUrl}/drafts/${slug}`,
    };
}
