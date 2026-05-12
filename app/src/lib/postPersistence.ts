import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from '@klaboworld/core/server/github';
import { env } from './env';
import { normalizeSlug } from './slugUtils';

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
const githubConfig = {
  token: env.GITHUB_TOKEN ?? '',
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
};

function shouldUseGitHub(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(env.GITHUB_TOKEN);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveSlug(base: string): Promise<string> {
  let candidate = base;
  let counter = 1;
  while (await fileExists(path.join(POSTS_DIR, `${candidate}.mdx`))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function toFrontMatterValue(value: string | string[] | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `\n${value.map((item) => `  - ${item}`).join('\n')}` : undefined;
  }
  return JSON.stringify(value);
}

function getLocalPostPath(slug: string) {
  return path.join(POSTS_DIR, `${slug}.mdx`);
}

function getGithubPostPath(slug: string) {
  return `${GITHUB_POSTS_DIR}/${slug}.mdx`;
}

function buildMarkdown(slug: string, input: PostInput) {
  const today = new Date().toISOString().slice(0, 10);
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

async function resolveExistingSha(relativePath: string): Promise<string | undefined> {
  try {
    const existing = await fetchRepoFile(githubConfig, relativePath);
    return existing.sha;
  } catch (error: unknown) {
    if (typeof error !== 'object' || error === null || (error as { status?: number }).status !== 404) {
      throw error;
    }
    return undefined;
  }
}

async function persistPostMarkdown(
  slug: string,
  content: string,
  message = `chore: update post ${slug}`,
  existingSha?: string,
) {
  const relativePath = getGithubPostPath(slug);
  if (!shouldUseGitHub()) {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    await fs.writeFile(getLocalPostPath(slug), content, 'utf8');
    return;
  }

  const sha = existingSha ?? (await resolveExistingSha(relativePath));
  await upsertRepoFile(githubConfig, {
    path: relativePath,
    message,
    content,
    sha,
  });
}

export async function createPost(input: PostInput) {
  const baseSlug = normalizeSlug(input.title);
  const slug = await resolveSlug(baseSlug);
  const markdown = buildMarkdown(slug, input);
  await persistPostMarkdown(slug, markdown);
  return { slug };
}

export async function updatePost(slug: string, input: PostInput) {
  const markdown = buildMarkdown(slug, input);
  await persistPostMarkdown(slug, markdown);
}

async function readPostMarkdown(slug: string): Promise<{ content: string; sha?: string }> {
  if (!shouldUseGitHub()) {
    return { content: await fs.readFile(getLocalPostPath(slug), 'utf8') };
  }

  const relativePath = getGithubPostPath(slug);
  const existing = await fetchRepoFile(githubConfig, relativePath);
  return {
    content: Buffer.from(existing.content, 'base64').toString('utf8'),
    sha: existing.sha,
  };
}

export async function deletePost(slug: string) {
  if (shouldUseGitHub()) {
    const relativePath = getGithubPostPath(slug);
    const existing = await fetchRepoFile(githubConfig, relativePath);
    await deleteRepoFile(githubConfig, relativePath, `chore: delete post ${slug}`, existing.sha);
  } else {
    await fs.unlink(getLocalPostPath(slug));
  }
}

export function getPostsDirectory() {
  return POSTS_DIR;
}

/**
 * Update just the xPostId field of a post without modifying other content.
 * Reads the existing file, parses frontmatter, updates xPostId, and writes back.
 */
export async function updatePostXPostId(slug: string, xPostId: string): Promise<void> {
  const current = await readPostMarkdown(slug);
  const parsed = matter(current.content);
  parsed.data.xPostId = xPostId;
  const updated = matter.stringify(parsed.content, parsed.data);
  await persistPostMarkdown(slug, updated, `chore: add xPostId to ${slug}`, current.sha);
}
