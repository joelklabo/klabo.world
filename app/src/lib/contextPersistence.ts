import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from 'slugify';
import { resolveContentDir, resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from '@klaboworld/core/server/github';
import { env } from './env';

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

const CONTENT_DIR = resolveContentDir();
const CONTEXT_DIR = resolveContentSubdir('contexts');
const GITHUB_CONTEXT_DIR = 'content/contexts';
const githubConfig = {
  token: env.GITHUB_TOKEN ?? '',
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
};

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
    const existing = await fetchRepoFile(githubConfig, relativePath);
    sha = existing.sha;
  } catch (error: unknown) {
    if (typeof error !== 'object' || error === null || (error as { status?: number }).status !== 404) {
      throw error;
    }
  }
  await upsertRepoFile(githubConfig, {
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
    const existing = await fetchRepoFile(githubConfig, relativePath);
    await deleteRepoFile(githubConfig, relativePath, `chore: delete context ${normalized}`, existing.sha);
  } else {
    await fs.unlink(path.join(CONTEXT_DIR, `${normalized}.mdx`));
  }
}

export function getContextsDirectory() {
  return CONTEXT_DIR;
}
