import {
  createGitHubClient,
  deleteRepoFile as coreDelete,
  fetchRepoFile as coreFetch,
  upsertRepoFile as coreUpsert,
} from '@klaboworld/core/server/github';
import { env } from './env';

const config = {
  token: env.GITHUB_TOKEN ?? '',
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
};

export async function fetchRepoFile(path: string) {
  return coreFetch(config, path);
}

export async function upsertRepoFile(params: { path: string; message: string; content: string; sha?: string }) {
  return coreUpsert(config, params);
}

export async function deleteRepoFile(path: string, message: string, sha: string) {
  return coreDelete(config, path, message, sha);
}
