import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from 'slugify';
import { env } from './env';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from './github-service';

export type PostInput = {
  title: string;
  summary: string;
  tags: string[];
  body: string;
  featuredImage?: string | null;
  publishDate?: string | null;
};

const POSTS_DIR = path.join(process.cwd(), 'content/posts');
const GITHUB_POSTS_DIR = 'content/posts';

function shouldUseGitHub(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(env.GITHUB_TOKEN);
}

function normalizeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
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
    return value.length ? `\n${value.map((item) => `  - ${item}`).join('\n')}` : undefined;
  }
  return JSON.stringify(value);
}

function buildMarkdown(slug: string, input: PostInput) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(input.title)}`);
  lines.push(`summary: ${JSON.stringify(input.summary)}`);
  lines.push(`date: ${today}`);
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
  lines.push('---');
  lines.push('');
  lines.push(input.body.trim());
  if (!input.body.endsWith('\n')) {
    lines.push('');
  }
  return lines.join('\n');
}

async function writeLocalFile(slug: string, content: string) {
  await fs.mkdir(POSTS_DIR, { recursive: true });
  await fs.writeFile(path.join(POSTS_DIR, `${slug}.mdx`), content, 'utf8');
}

async function writeGitHubFile(slug: string, content: string) {
  const relativePath = `${GITHUB_POSTS_DIR}/${slug}.mdx`;
  let sha: string | undefined;
  try {
    const existing = await fetchRepoFile(relativePath);
    sha = existing.sha;
  } catch (error: unknown) {
    if (typeof error !== 'object' || error === null || (error as { status?: number }).status !== 404) {
      throw error;
    }
  }
  await upsertRepoFile({
    path: relativePath,
    message: `chore: update post ${slug}`,
    content,
    sha,
  });
}

export async function createPost(input: PostInput) {
  const baseSlug = normalizeSlug(input.title);
  const slug = await resolveSlug(baseSlug);
  const markdown = buildMarkdown(slug, input);
  if (shouldUseGitHub()) {
    await writeGitHubFile(slug, markdown);
  } else {
    await writeLocalFile(slug, markdown);
  }
  return { slug };
}

export async function updatePost(slug: string, input: PostInput) {
  const markdown = buildMarkdown(slug, input);
  if (shouldUseGitHub()) {
    await writeGitHubFile(slug, markdown);
  } else {
    await writeLocalFile(slug, markdown);
  }
}

export async function deletePost(slug: string) {
  if (shouldUseGitHub()) {
    const relativePath = `${GITHUB_POSTS_DIR}/${slug}.mdx`;
    const existing = await fetchRepoFile(relativePath);
    await deleteRepoFile(relativePath, `chore: delete post ${slug}`, existing.sha);
  } else {
    await fs.unlink(path.join(POSTS_DIR, `${slug}.mdx`));
  }
}
