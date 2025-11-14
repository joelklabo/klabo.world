import { Octokit } from '@octokit/rest';
import { env } from './env';

type GitHubFileParams = {
  path: string;
  message: string;
  content: string;
  sha?: string;
};

function getOctokit() {
  if (!env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN missing; GitHub operations are disabled');
  }
  return new Octokit({ auth: env.GITHUB_TOKEN });
}

export async function fetchRepoFile(path: string) {
  const octokit = getOctokit();
  const res = await octokit.repos.getContent({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    path,
  });
  if (!('content' in res.data)) {
    throw new Error(`Path ${path} is not a file`);
  }
  const decoded = Buffer.from(res.data.content, 'base64').toString('utf8');
  return { content: decoded, sha: res.data.sha };
}

export async function upsertRepoFile({ path, message, content, sha }: GitHubFileParams) {
  const octokit = getOctokit();
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const res = await octokit.repos.createOrUpdateFileContents({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    path,
    message,
    content: encoded,
    sha,
  });
  return res.data.content?.sha;
}

export async function deleteRepoFile(path: string, message: string, sha: string) {
  const octokit = getOctokit();
  await octokit.repos.deleteFile({ owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, path, message, sha });
}
