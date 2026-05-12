import matter from 'gray-matter';
import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { normalizeSlug } from './slugUtils';
import { getCurrentDateString } from './dateDisplay';
import { persistContentFile, readContentFile, removeContentFile } from './contentFilePersistence';
import { resolveAvailableSlug } from './contentSlugHelpers';

type PostInput = {
  title: string;
  summary: string;
  tags: string[];
  body: string;
  featuredImage?: string | null;
  publishDate?: string | null;
  lightningAddress?: string | null;
  nostrPubkey?: string | null;
  nostrRelays?: string[];
  nostrstackEnabled?: boolean | null;
  xPostId?: string | null;
};

const POSTS_DIR = resolveContentSubdir('posts');
const GITHUB_POSTS_DIR = 'content/posts';
const POST_FILE_EXTENSION = 'mdx';

function toFrontMatterValue(value: string | string[] | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `\n${value.map((item) => `  - ${item}`).join('\n')}` : undefined;
  }
  return JSON.stringify(value);
}

function buildMarkdown(slug: string, input: PostInput) {
  const today = getCurrentDateString();
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(input.title)}`);
  lines.push(`summary: ${JSON.stringify(input.summary)}`, `date: ${today}`);
  if (input.publishDate) {
    lines.push(`publishDate: ${input.publishDate}`);
  }
  const tagsValue = toFrontMatterValue(input.tags);
  if (tagsValue) {
    lines.push(`tags:${tagsValue}`);
  }
  if (input.featuredImage) {
    lines.push(`featuredImage: ${JSON.stringify(input.featuredImage)}`);
  }
   if (input.lightningAddress) {
     lines.push(`lightningAddress: ${JSON.stringify(input.lightningAddress)}`);
   }
   if (input.nostrPubkey) {
     lines.push(`nostrPubkey: ${JSON.stringify(input.nostrPubkey)}`);
   }
   const relaysValue = toFrontMatterValue(input.nostrRelays);
   if (relaysValue) {
     lines.push(`nostrRelays:${relaysValue}`);
   }
  if (input.nostrstackEnabled === false) {
    lines.push('nostrstackEnabled: false');
  }
  if (input.xPostId) {
    lines.push(`xPostId: ${JSON.stringify(input.xPostId)}`);
  }
  lines.push('---', '');
  lines.push(input.body.trim());
  if (!input.body.endsWith('\n')) {
    lines.push('');
  }
  return lines.join('\n');
}

const contentStorage = {
  baseDir: POSTS_DIR,
  githubDir: GITHUB_POSTS_DIR,
  extension: POST_FILE_EXTENSION,
};

export async function createPost(input: PostInput) {
  const baseSlug = normalizeSlug(input.title);
  const slug = await resolveAvailableSlug(baseSlug, POSTS_DIR, 'mdx');
  const markdown = buildMarkdown(slug, input);
  await persistContentFile({
    ...contentStorage,
    slug,
    content: markdown,
    message: `chore: update post ${slug}`,
  });
  return { slug };
}

export async function updatePost(slug: string, input: PostInput) {
  const markdown = buildMarkdown(slug, input);
  await persistContentFile({
    ...contentStorage,
    slug,
    content: markdown,
    message: `chore: update post ${slug}`,
  });
}

export async function deletePost(slug: string) {
  await removeContentFile({
    ...contentStorage,
    slug,
    message: `chore: delete post ${slug}`,
  });
}

export function getPostsDirectory() {
  return POSTS_DIR;
}

/**
 * Update just the xPostId field of a post without modifying other content.
 * Reads the existing file, parses frontmatter, updates xPostId, and writes back.
 */
export async function updatePostXPostId(slug: string, xPostId: string): Promise<void> {
  const current = await readContentFile({ ...contentStorage, slug });
  const parsed = matter(current.content);
  parsed.data.xPostId = xPostId;
  const updated = matter.stringify(parsed.content, parsed.data);
  await persistContentFile({
    ...contentStorage,
    slug,
    content: updated,
    message: `chore: add xPostId to ${slug}`,
    existingSha: current.sha,
  });
}
