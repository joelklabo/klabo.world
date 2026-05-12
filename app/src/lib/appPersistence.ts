import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from '@klaboworld/core/server/github';
import { env } from './env';
import { normalizeSlug } from './slugUtils';

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

function getLocalAppPath(slug: string) {
  return path.join(APPS_DIR, `${slug}.json`);
}

function getGithubAppPath(slug: string) {
  return `${GITHUB_APPS_DIR}/${slug}.json`;
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

async function persistAppJson(
  slug: string,
  content: string,
  message = `chore: update app ${slug}`,
  existingSha?: string,
) {
  const relativePath = getGithubAppPath(slug);
  if (!shouldUseGitHub()) {
    await fs.mkdir(APPS_DIR, { recursive: true });
    await fs.writeFile(getLocalAppPath(slug), content, 'utf8');
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

export async function upsertApp(slug: string, input: AppInput) {
  const normalizedSlug = normalizeSlug(slug);
  const payload = {
    ...input,
    slug: normalizedSlug,
  };
  const content = JSON.stringify(payload, null, 2);
  await persistAppJson(normalizedSlug, content);
}

export async function deleteApp(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  if (shouldUseGitHub()) {
    const relativePath = getGithubAppPath(normalizedSlug);
    const existing = await fetchRepoFile(githubConfig, relativePath);
    await deleteRepoFile(githubConfig, relativePath, `chore: delete app ${normalizedSlug}`, existing.sha);
  } else {
    await fs.unlink(getLocalAppPath(normalizedSlug));
  }
}

export function getAppsDirectory() {
  return APPS_DIR;
}
