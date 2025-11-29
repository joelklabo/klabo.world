import fs from 'node:fs/promises';
import path from 'node:path';
import slugify from 'slugify';
import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from '@klaboworld/core/server/github';
import { env } from './env';

export type AppInput = {
  name: string;
  slug: string;
  publishDate: string;
  version: string;
  fullDescription: string;
  features: string[];
  icon?: string;
  screenshots?: string[];
  githubURL?: string;
  appStoreURL?: string;
};

const APPS_DIR = resolveContentSubdir('apps');
const GITHUB_APPS_DIR = 'content/apps';
const githubConfig = {
  token: env.GITHUB_TOKEN ?? '',
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
};

function shouldUseGitHub(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(env.GITHUB_TOKEN);
}

function sanitizeSlug(slug: string): string {
  return slugify(slug, { lower: true, strict: true });
}

async function writeLocalFile(slug: string, content: string) {
  await fs.mkdir(APPS_DIR, { recursive: true });
  await fs.writeFile(path.join(APPS_DIR, `${slug}.json`), content, 'utf8');
}

async function writeGitHubFile(slug: string, content: string) {
  const relativePath = `${GITHUB_APPS_DIR}/${slug}.json`;
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
    message: `chore: update app ${slug}`,
    content,
    sha,
  });
}

export async function upsertApp(slug: string, input: AppInput) {
  const normalizedSlug = sanitizeSlug(slug);
  const payload = {
    ...input,
    slug: normalizedSlug,
  };
  const content = JSON.stringify(payload, null, 2);
  if (shouldUseGitHub()) {
    await writeGitHubFile(normalizedSlug, content);
  } else {
    await writeLocalFile(normalizedSlug, content);
  }
}

export async function deleteApp(slug: string) {
  const normalizedSlug = sanitizeSlug(slug);
  if (shouldUseGitHub()) {
    const relativePath = `${GITHUB_APPS_DIR}/${normalizedSlug}.json`;
    const existing = await fetchRepoFile(githubConfig, relativePath);
    await deleteRepoFile(githubConfig, relativePath, `chore: delete app ${normalizedSlug}`, existing.sha);
  } else {
    await fs.unlink(path.join(APPS_DIR, `${normalizedSlug}.json`));
  }
}

export function getAppsDirectory() {
  return APPS_DIR;
}
