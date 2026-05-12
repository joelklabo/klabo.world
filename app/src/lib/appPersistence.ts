import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { deleteRepoFile, fetchRepoFile, resolveExistingSha, shouldUseGitHubStorage, upsertRepoFile } from './github-service';
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

function getLocalAppPath(slug: string) {
  return path.join(APPS_DIR, `${slug}.json`);
}

function getGithubAppPath(slug: string) {
  return `${GITHUB_APPS_DIR}/${slug}.json`;
}

async function persistAppJson(
  slug: string,
  content: string,
  message = `chore: update app ${slug}`,
  existingSha?: string,
) {
  const relativePath = getGithubAppPath(slug);
  if (!shouldUseGitHubStorage()) {
    await fs.mkdir(APPS_DIR, { recursive: true });
    await fs.writeFile(getLocalAppPath(slug), content, 'utf8');
    return;
  }

  const sha = existingSha ?? (await resolveExistingSha(relativePath));
  await upsertRepoFile({
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
  if (shouldUseGitHubStorage()) {
    const relativePath = getGithubAppPath(normalizedSlug);
    const existing = await fetchRepoFile(relativePath);
    await deleteRepoFile(relativePath, `chore: delete app ${normalizedSlug}`, existing.sha);
  } else {
    await fs.unlink(getLocalAppPath(normalizedSlug));
  }
}

export function getAppsDirectory() {
  return APPS_DIR;
}
