import { resolveContentSubdir } from '@klaboworld/core/server/contentPaths';
import { persistContentFile, removeContentFile } from './contentFilePersistence';
import { resolveAvailableSlug } from './contentSlugHelpers';
import { type DashboardPanelType } from './dashboardPanelTypes';
import { normalizeSlug } from './slugUtils';

export type DashboardInput = {
  title: string;
  summary: string;
  panelType: DashboardPanelType;
  tags: string[];
  chartType?: string | null;
  kqlQuery?: string | null;
  iframeUrl?: string | null;
  externalUrl?: string | null;
  refreshIntervalSeconds?: number | null;
  notes?: string | null;
};

const DASHBOARDS_DIR = resolveContentSubdir('dashboards');
const GITHUB_DASHBOARD_DIR = 'content/dashboards';
const DASHBOARD_FILE_EXTENSION = 'mdx';

const contentStorage = {
  baseDir: DASHBOARDS_DIR,
  githubDir: GITHUB_DASHBOARD_DIR,
  extension: DASHBOARD_FILE_EXTENSION,
};

function pushString(lines: string[], key: string, value?: string | null) {
  if (!value) return;
  lines.push(`${key}: ${JSON.stringify(value)}`);
}

function pushList(lines: string[], key: string, values?: string[] | null) {
  if (!values || values.length === 0) return;
  lines.push(`${key}:`);
  for (const value of values) lines.push(`  - ${JSON.stringify(value)}`);
}

function pushNumber(lines: string[], key: string, value?: number | null) {
  if (typeof value !== 'number') return;
  lines.push(`${key}: ${value}`);
}

function pushKql(lines: string[], query?: string | null) {
  if (!query) return;
  lines.push('kqlQuery: |');
  for (const line of query.split('\n')) lines.push(`  ${line}`);
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

export async function createDashboard(input: DashboardInput) {
  const baseSlug = normalizeSlug(input.title);
  const slug = await resolveAvailableSlug(baseSlug, DASHBOARDS_DIR, 'mdx');
  const markdown = buildMarkdown(slug, input);
  await persistContentFile({
    ...contentStorage,
    slug,
    content: markdown,
    message: `chore: update dashboard ${slug}`,
  });
  return { slug };
}

export async function updateDashboard(slug: string, input: DashboardInput) {
  const markdown = buildMarkdown(slug, input);
  await persistContentFile({
    ...contentStorage,
    slug,
    content: markdown,
    message: `chore: update dashboard ${slug}`,
  });
}

export async function deleteDashboard(slug: string) {
  await removeContentFile({
    ...contentStorage,
    slug,
    message: `chore: delete dashboard ${slug}`,
  });
}

export function getDashboardsDirectory() {
  return DASHBOARDS_DIR;
}
