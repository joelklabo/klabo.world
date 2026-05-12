import fs from 'node:fs/promises';
import path from 'node:path';
import { deleteRepoFile, fetchRepoFile, resolveExistingSha, shouldUseGitHubStorage, upsertRepoFile } from './github-service';

type StorageConfig = {
  baseDir: string;
  githubDir: string;
  extension: string;
  slug: string;
};

function getLocalPath({ baseDir, extension, slug }: StorageConfig) {
  return path.join(baseDir, `${slug}.${extension}`);
}

function getGithubPath({ githubDir, extension, slug }: StorageConfig) {
  return `${githubDir}/${slug}.${extension}`;
}

type PersistContentFileParams = StorageConfig & {
  content: string;
  message: string;
  existingSha?: string;
};

export async function persistContentFile({
  content,
  message,
  existingSha,
  ...config
}: PersistContentFileParams): Promise<void> {
  if (!shouldUseGitHubStorage()) {
    await fs.mkdir(config.baseDir, { recursive: true });
    await fs.writeFile(getLocalPath(config), content, 'utf8');
    return;
  }

  const relativePath = getGithubPath(config);
  const sha = existingSha ?? (await resolveExistingSha(relativePath));
  await upsertRepoFile({
    path: relativePath,
    message,
    content,
    sha,
  });
}

type RemoveContentFileParams = StorageConfig & {
  message: string;
};

export async function removeContentFile({ message, ...config }: RemoveContentFileParams): Promise<void> {
  if (!shouldUseGitHubStorage()) {
    await fs.unlink(getLocalPath(config));
    return;
  }

  const relativePath = getGithubPath(config);
  const existing = await fetchRepoFile(relativePath);
  await deleteRepoFile(relativePath, message, existing.sha);
}

type ReadContentFileParams = StorageConfig;

export async function readContentFile(config: ReadContentFileParams): Promise<{ content: string; sha?: string }> {
  if (!shouldUseGitHubStorage()) {
    return { content: await fs.readFile(getLocalPath(config), 'utf8') };
  }

  const relativePath = getGithubPath(config);
  const existing = await fetchRepoFile(relativePath);
  return {
    content: Buffer.from(existing.content, 'base64').toString('utf8'),
    sha: existing.sha,
  };
}

