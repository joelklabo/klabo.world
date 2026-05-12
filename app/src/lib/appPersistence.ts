import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { normalizeSlug } from './slugUtils';
import { persistContentFile, removeContentFile } from './contentFilePersistence';

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
const APP_FILE_EXTENSION = 'json';
const contentStorage = {
  baseDir: APPS_DIR,
  githubDir: GITHUB_APPS_DIR,
  extension: APP_FILE_EXTENSION,
};

export async function upsertApp(slug: string, input: AppInput) {
  const normalizedSlug = normalizeSlug(slug);
  const payload = {
    ...input,
    slug: normalizedSlug,
  };
  const content = JSON.stringify(payload, null, 2);
  await persistContentFile({
    ...contentStorage,
    slug: normalizedSlug,
    content,
    message: `chore: update app ${normalizedSlug}`,
  });
}

export async function deleteApp(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  await removeContentFile({
    ...contentStorage,
    slug: normalizedSlug,
    message: `chore: delete app ${normalizedSlug}`,
  });
}

export function getAppsDirectory() {
  return APPS_DIR;
}
