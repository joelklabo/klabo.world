import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import slugify from 'slugify';
import { env } from './env';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from './github-service';

export type ContextInput = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  createdDate: string;
  updatedDate: string;
  tags: string[];
  isPublished: boolean;
};

const POSSIBLE_CONTENT_DIRS = [
  path.resolve(process.cwd(), 'content'),
  path.resolve(process.cwd(), '../content'),
];

const CONTENT_DIR = POSSIBLE_CONTENT_DIRS.find((dir) => existsSync(dir)) ?? POSSIBLE_CONTENT_DIRS[0];
const CONTEXT_DIR = path.join(CONTENT_DIR, 'contexts');
const GITHUB_CONTEXT_DIR = 'content/contexts';

function shouldUseGitHub(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(env.GITHUB_TOKEN);
}

function normalizeSlug(slug: string): string {
  return slugify(slug, { lower: true, strict: true });
}

function buildMarkdown(input: ContextInput): string {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(input.title)}`);
  lines.push(`summary: ${JSON.stringify(input.summary)}`);
  lines.push(`createdDate: ${input.createdDate}`);
  lines.push(`updatedDate: ${input.updatedDate}`);
  lines.push(`isPublished: ${input.isPublished}`);
  if (input.tags.length) {
    lines.push('tags:');
    input.tags.forEach((tag) => lines.push(`  - ${tag}`));
  }
  lines.push('---', '', input.content.trim());
  return lines.join('\n');
}

async function writeLocalFile(slug: string, content: string) {
  await fs.mkdir(CONTEXT_DIR, { recursive: true });
  await fs.writeFile(path.join(CONTEXT_DIR, `${slug}.mdx`), content, 'utf8');
}

async function writeGitHubFile(slug: string, content: string) {
  const relativePath = `${GITHUB_CONTEXT_DIR}/${slug}.mdx`;
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
    message: `chore: update context ${slug}`,
    content,
    sha,
  });
}

export async function upsertContext(slug: string, input: ContextInput) {
  const normalized = normalizeSlug(slug);
  const markdown = buildMarkdown({ ...input, slug: normalized });
  if (shouldUseGitHub()) {
    await writeGitHubFile(normalized, markdown);
  } else {
    await writeLocalFile(normalized, markdown);
  }
}

export async function deleteContext(slug: string) {
  const normalized = normalizeSlug(slug);
  if (shouldUseGitHub()) {
    const relativePath = `${GITHUB_CONTEXT_DIR}/${normalized}.mdx`;
    const existing = await fetchRepoFile(relativePath);
    await deleteRepoFile(relativePath, `chore: delete context ${normalized}`, existing.sha);
  } else {
    await fs.unlink(path.join(CONTEXT_DIR, `${normalized}.mdx`));
  }
}

export function getContextsDirectory() {
  return CONTEXT_DIR;
}
