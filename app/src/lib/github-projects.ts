import { env } from "@/lib/env";
import { promises as fs } from "fs";
import path from "path";

export type GitHubProject = {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  isArchived: boolean;
  primaryLanguage: { name: string; color: string | null } | null;
  topics: string[];
  pushedAt: string | null;
  updatedAt: string | null;
};

type GitHubGraphQLError = {
  message: string;
};

type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: GitHubGraphQLError[];
};

type PinnedRepoNode = {
  __typename: "Repository";
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  isArchived: boolean;
  isFork: boolean;
  isPrivate: boolean;
  pushedAt: string | null;
  updatedAt: string | null;
  owner: { login: string };
  primaryLanguage: { name: string; color: string | null } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
};

type PinnedQueryData = {
  user: {
    pinnedItems: {
      nodes: Array<PinnedRepoNode | null>;
    };
  } | null;
};

type RepoRestResponse = Array<{
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  fork: boolean;
  pushed_at: string | null;
  updated_at: string | null;
  language: string | null;
  topics?: string[];
}>;

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    "User-Agent": "klabo-world-next",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  return headers;
}

function uniqBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}

async function readCachedGitHubProjects(owner: string) {
  const candidates = [
    path.join(process.cwd(), "app", "data", "github", `${owner}.json`),
    path.join(process.cwd(), "data", "github", `${owner}.json`),
  ];

  for (const filePath of candidates) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as GitHubProject[];
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      // continue
    }
  }
  return null;
}

function normalizeRestRepo(repo: RepoRestResponse[number]): GitHubProject {
  return {
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    homepageUrl: repo.homepage ?? null,
    stargazerCount: repo.stargazers_count,
    forkCount: repo.forks_count,
    isArchived: repo.archived,
    primaryLanguage: repo.language ? { name: repo.language, color: null } : null,
    topics: repo.topics ?? [],
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
  };
}

function normalizePinnedRepo(repo: PinnedRepoNode): GitHubProject {
  const fullName = `${repo.owner.login}/${repo.name}`;
  return {
    name: repo.name,
    fullName,
    description: repo.description,
    url: repo.url,
    homepageUrl: repo.homepageUrl ?? null,
    stargazerCount: repo.stargazerCount,
    forkCount: repo.forkCount,
    isArchived: repo.isArchived,
    primaryLanguage: repo.primaryLanguage,
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    pushedAt: repo.pushedAt,
    updatedAt: repo.updatedAt,
  };
}

export async function getPinnedGitHubProjects(
  owner: string,
  limit = 6,
): Promise<GitHubProject[]> {
  if (!env.GITHUB_TOKEN) {
    return [];
  }

  const query = `
    query ($login: String!, $first: Int!) {
      user(login: $login) {
        pinnedItems(first: $first, types: [REPOSITORY]) {
          nodes {
            __typename
            ... on Repository {
              name
              description
              url
              homepageUrl
              stargazerCount
              forkCount
              isArchived
              isFork
              isPrivate
              pushedAt
              updatedAt
              owner { login }
              primaryLanguage { name color }
              repositoryTopics(first: 10) {
                nodes { topic { name } }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: getGitHubHeaders(),
    body: JSON.stringify({ query, variables: { login: owner, first: limit } }),
    next: { revalidate: 60 * 60 },
  });

  const payload = (await response.json()) as GitHubGraphQLResponse<PinnedQueryData>;
  if (!response.ok || payload.errors?.length) {
    const msg =
      payload.errors?.map((err) => err.message).join("; ") ??
      `GitHub GraphQL returned ${response.status}`;
    throw new Error(msg);
  }

  const nodes = payload.data?.user?.pinnedItems.nodes ?? [];
  return nodes
    .filter((node): node is PinnedRepoNode => Boolean(node && node.__typename === "Repository"))
    .filter((repo) => !repo.isPrivate && !repo.isFork && !repo.isArchived)
    .map(normalizePinnedRepo);
}

export async function getRecentGitHubProjects(
  owner: string,
  limit = 12,
): Promise<GitHubProject[]> {
  const url = new URL(`https://api.github.com/users/${owner}/repos`);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("per_page", String(Math.min(100, limit)));
  url.searchParams.set("type", "owner");

  const response = await fetch(url.toString(), {
    headers: getGitHubHeaders(),
    next: { revalidate: 60 * 60 },
  });
  if (!response.ok) {
    throw new Error(`GitHub repos request failed (${response.status})`);
  }

  const repos = (await response.json()) as RepoRestResponse;
  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .map(normalizeRestRepo)
    .slice(0, limit);
}

export async function getFeaturedGitHubProjects(
  owner: string,
  limit = 6,
): Promise<GitHubProject[]> {
  const pinned = await getPinnedGitHubProjects(owner, limit).catch(() => []);
  const missing = Math.max(0, limit - pinned.length);
  if (missing === 0) {
    return pinned.slice(0, limit);
  }

  const recent = await getRecentGitHubProjects(owner, Math.max(limit, missing * 2)).catch(() => []);
  const combined = uniqBy([...pinned, ...recent], (project) => project.fullName)
    .filter((project) => !project.isArchived);

  const result = combined.slice(0, limit);
  if (result.length > 0) {
    return result;
  }

  const cached = await readCachedGitHubProjects(owner);
  return cached?.slice(0, limit) ?? [];
}
