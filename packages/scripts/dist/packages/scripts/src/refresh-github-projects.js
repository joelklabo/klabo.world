import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
function usage() {
    // eslint-disable-next-line no-console
    console.error([
        'Usage: pnpm --filter @klaboworld/scripts run github-snapshot -- --owner <login> [--out <path>] [--limit <n>] [--pinned <n>] [--recent <n>]',
        '',
        'Environment:',
        '  GITHUB_TOKEN   Optional but recommended (enables pinned repos + higher rate limits).',
        '  GITHUB_OWNER   Used as default for --owner when provided.',
        '',
        'Examples:',
        '  pnpm --filter @klaboworld/scripts run github-snapshot -- --owner joelklabo',
        '  pnpm --filter @klaboworld/scripts run github-snapshot -- --owner joelklabo --out app/data/github/joelklabo.json --limit 18',
    ].join('\n'));
    process.exit(1);
}
function parseNumber(value, fallback) {
    if (!value)
        return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith('--'))
            continue;
        const key = token.slice(2);
        const value = argv[i + 1];
        if (!value || value.startsWith('--')) {
            args[key] = 'true';
            continue;
        }
        args[key] = value;
        i += 1;
    }
    const owner = args.owner ?? process.env.GITHUB_OWNER;
    if (!owner || owner === 'true') {
        usage();
    }
    const limit = parseNumber(args.limit, 24);
    const pinned = parseNumber(args.pinned, 12);
    const recent = parseNumber(args.recent, Math.max(30, limit));
    const outFileRaw = args.out ?? `app/data/github/${owner}.json`;
    const outFile = path.isAbsolute(outFileRaw) ? outFileRaw : path.resolve(repoRoot, outFileRaw);
    return { owner, outFile, limit, pinned, recent };
}
function getGitHubHeaders() {
    const headers = {
        'User-Agent': 'klabo-world-next-snapshot',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}
function uniqBy(items, key) {
    const seen = new Set();
    const result = [];
    for (const item of items) {
        const k = key(item);
        if (seen.has(k))
            continue;
        seen.add(k);
        result.push(item);
    }
    return result;
}
function normalizeRestRepo(repo) {
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
function normalizePinnedRepo(repo) {
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
async function getPinnedGitHubProjects(owner, limit) {
    if (!process.env.GITHUB_TOKEN) {
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
              repositoryTopics(first: 10) { nodes { topic { name } } }
            }
          }
        }
      }
    }
  `;
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: getGitHubHeaders(),
        body: JSON.stringify({ query, variables: { login: owner, first: limit } }),
    });
    const payload = (await response.json());
    if (!response.ok || payload.errors?.length) {
        const msg = payload.errors?.map((err) => err.message).join('; ') ??
            `GitHub GraphQL returned ${response.status}`;
        throw new Error(msg);
    }
    const nodes = payload.data?.user?.pinnedItems.nodes ?? [];
    return nodes
        .filter((node) => Boolean(node && node.__typename === 'Repository'))
        .filter((repo) => !repo.isPrivate && !repo.isFork && !repo.isArchived)
        .map(normalizePinnedRepo);
}
async function getRecentGitHubProjects(owner, limit) {
    const url = new URL(`https://api.github.com/users/${owner}/repos`);
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('per_page', String(Math.min(100, limit)));
    url.searchParams.set('type', 'owner');
    const response = await fetch(url.toString(), { headers: getGitHubHeaders() });
    if (!response.ok) {
        throw new Error(`GitHub repos request failed (${response.status})`);
    }
    const repos = (await response.json());
    return repos.filter((repo) => !repo.fork && !repo.archived).map(normalizeRestRepo).slice(0, limit);
}
async function main() {
    const { owner, outFile, limit, pinned: pinnedLimit, recent: recentLimit } = parseArgs(process.argv.slice(2));
    const pinned = await getPinnedGitHubProjects(owner, pinnedLimit).catch(() => []);
    const recent = await getRecentGitHubProjects(owner, recentLimit).catch(() => []);
    const projects = uniqBy([...pinned, ...recent], (repo) => repo.fullName)
        .filter((repo) => !repo.isArchived)
        .slice(0, limit);
    const outDir = path.dirname(outFile);
    await mkdir(outDir, { recursive: true });
    await writeFile(outFile, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Wrote ${projects.length} GitHub projects → ${path.relative(repoRoot, outFile)}`);
}
main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
});
