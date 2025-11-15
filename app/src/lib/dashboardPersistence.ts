import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import slugify from 'slugify';
import { env } from './env';
import { deleteRepoFile, fetchRepoFile, upsertRepoFile } from './github-service';

export type DashboardType = 'chart' | 'logs' | 'embed' | 'link';

export type DashboardInput = {
  title: string;
  summary: string;
  panelType: DashboardType;
  tags: string[];
  chartType?: string | null;
  kqlQuery?: string | null;
  iframeUrl?: string | null;
  externalUrl?: string | null;
  refreshIntervalSeconds?: number | null;
  notes?: string | null;
};

const POSSIBLE_CONTENT_DIRS = [
  path.resolve(process.cwd(), 'content'),
  path.resolve(process.cwd(), '../content'),
];

const CONTENT_DIR = POSSIBLE_CONTENT_DIRS.find((dir) => existsSync(dir)) ?? POSSIBLE_CONTENT_DIRS[0];
const DASHBOARDS_DIR = path.join(CONTENT_DIR, 'dashboards');
const GITHUB_DASHBOARD_DIR = 'content/dashboards';

function shouldUseGitHub(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(env.GITHUB_TOKEN);
}

function normalizeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveSlug(base: string): Promise<string> {
  let candidate = base;
  let counter = 1;
  while (await fileExists(path.join(DASHBOARDS_DIR, `${candidate}.mdx`))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function pushString(lines: string[], key: string, value?: string | null) {
  if (!value) return;
  lines.push(`${key}: ${JSON.stringify(value)}`);
}

function pushList(lines: string[], key: string, values?: string[] | null) {
  if (!values || values.length === 0) return;
  lines.push(`${key}:`);
  values.forEach((value) => lines.push(`  - ${JSON.stringify(value)}`));
}

function pushNumber(lines: string[], key: string, value?: number | null) {
  if (typeof value !== 'number') return;
  lines.push(`${key}: ${value}`);
}

function pushKql(lines: string[], query?: string | null) {
  if (!query) return;
  lines.push('kqlQuery: |');
  query.split('\n').forEach((line) => lines.push(`  ${line}`));
}

function buildMarkdown(slug: string, input: DashboardInput) {
  const lines = ['---'];
  pushString(lines, 'title', input.title);
  pushString(lines, 'summary', input.summary);
  pushString(lines, 'panelType', input.panelType);
  pushList(lines, 'tags', input.tags);
  pushString(lines, 'chartType', input.chartType);
  pushString(lines, 'iframeUrl', input.iframeUrl);
  pushString(lines, 'externalUrl', input.externalUrl);
  pushNumber(lines, 'refreshIntervalSeconds', input.refreshIntervalSeconds ?? null);
  pushKql(lines, input.kqlQuery);
  lines.push('---', '');
  if (input.notes && input.notes.trim().length > 0) {
    lines.push(input.notes.trim());
    if (!input.notes.trim().endsWith('\n')) {
      lines.push('');
    }
  } else {
    lines.push(`Dashboard **${input.title}** (${slug}). Add notes or runbooks here.`);
  }
  return lines.join('\n');
}

async function writeLocalFile(slug: string, content: string) {
  await fs.mkdir(DASHBOARDS_DIR, { recursive: true });
  await fs.writeFile(path.join(DASHBOARDS_DIR, `${slug}.mdx`), content, 'utf8');
}

async function writeGitHubFile(slug: string, content: string) {
  const relativePath = `${GITHUB_DASHBOARD_DIR}/${slug}.mdx`;
  let sha: string | undefined;
  try {
    const existing = await fetchRepoFile(relativePath);
    sha = existing.sha;
  } catch (error) {
    if ((error as { status?: number }).status !== 404) {
      throw error;
    }
  }
  await upsertRepoFile({
    path: relativePath,
    message: `chore: update dashboard ${slug}`,
    content,
    sha,
  });
}

export async function createDashboard(input: DashboardInput) {
  const baseSlug = normalizeSlug(input.title);
  const slug = await resolveSlug(baseSlug);
  const markdown = buildMarkdown(slug, input);
  if (shouldUseGitHub()) {
    await writeGitHubFile(slug, markdown);
  } else {
    await writeLocalFile(slug, markdown);
  }
  return { slug };
}

export async function updateDashboard(slug: string, input: DashboardInput) {
  const markdown = buildMarkdown(slug, input);
  if (shouldUseGitHub()) {
    await writeGitHubFile(slug, markdown);
  } else {
    await writeLocalFile(slug, markdown);
  }
}

export async function deleteDashboard(slug: string) {
  if (shouldUseGitHub()) {
    const relativePath = `${GITHUB_DASHBOARD_DIR}/${slug}.mdx`;
    const existing = await fetchRepoFile(relativePath);
    await deleteRepoFile(relativePath, `chore: delete dashboard ${slug}`, existing.sha);
  } else {
    await fs.unlink(path.join(DASHBOARDS_DIR, `${slug}.mdx`));
  }
}

export function getDashboardsDirectory() {
  return DASHBOARDS_DIR;
}
