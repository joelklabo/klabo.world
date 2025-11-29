import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export type GitHubFileParams = {
  path: string;
  message: string;
  content: string;
  sha?: string;
};

export function createGitHubClient(config: GitHubConfig) {
  if (!config.token) {
    throw new Error('GITHUB_TOKEN missing; GitHub operations are disabled');
  }
  return new Octokit({ auth: config.token });
}

export async function fetchRepoFile(config: GitHubConfig, path: string) {
  const octokit = createGitHubClient(config);
  const res = await octokit.repos.getContent({ owner: config.owner, repo: config.repo, path });
  if (!('content' in res.data)) {
    throw new Error(`Path ${path} is not a file`);
  }
  const decoded = Buffer.from(res.data.content, 'base64').toString('utf8');
  return { content: decoded, sha: res.data.sha };
}

export async function upsertRepoFile(config: GitHubConfig, params: GitHubFileParams) {
  const octokit = createGitHubClient(config);
  const encoded = Buffer.from(params.content, 'utf8').toString('base64');
  const res = await octokit.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: params.path,
    message: params.message,
    content: encoded,
    sha: params.sha,
  });
  return res.data.content?.sha;
}

export async function deleteRepoFile(config: GitHubConfig, path: string, message: string, sha: string) {
  const octokit = createGitHubClient(config);
  await octokit.repos.deleteFile({ owner: config.owner, repo: config.repo, path, message, sha });
}
