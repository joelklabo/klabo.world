import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { allDashboardDocs, type DashboardDoc } from 'contentlayer/generated';
import { getDashboardsDirectory } from './dashboardPersistence';

export type Dashboard = {
  slug: string;
  title: string;
  summary: string;
  panelType?: string | null;
  tags?: string[];
  chartType?: string | null;
  iframeUrl?: string | null;
  externalUrl?: string | null;
  refreshIntervalSeconds?: number | null;
  kqlQuery?: string | null;
  body: { raw: string };
};

function fromContentlayer(doc: DashboardDoc): Dashboard {
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary ?? '',
    panelType: doc.panelType,
    tags: doc.tags ?? [],
    chartType: doc.chartType ?? null,
    iframeUrl: doc.iframeUrl ?? null,
    externalUrl: doc.externalUrl ?? null,
    refreshIntervalSeconds: doc.refreshIntervalSeconds ?? null,
    kqlQuery: doc.kqlQuery ?? null,
    body: { raw: doc.body.raw },
  };
}

function readDiskDashboards(): Dashboard[] {
  const dir = getDashboardsDirectory();
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = path.basename(file, '.mdx');
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;

      return {
        slug,
        title: typeof data.title === 'string' ? data.title : slug,
        summary: typeof data.summary === 'string' ? data.summary : '',
        panelType: typeof data.panelType === 'string' ? data.panelType : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
        chartType: typeof data.chartType === 'string' ? data.chartType : undefined,
        iframeUrl: typeof data.iframeUrl === 'string' ? data.iframeUrl : undefined,
        externalUrl: typeof data.externalUrl === 'string' ? data.externalUrl : undefined,
        refreshIntervalSeconds: typeof data.refreshIntervalSeconds === 'number' ? data.refreshIntervalSeconds : undefined,
        kqlQuery: typeof data.kqlQuery === 'string' ? data.kqlQuery : undefined,
        body: { raw: parsed.content.trim() },
      } satisfies Dashboard;
    });
}

function mergeDashboards(): Dashboard[] {
  const contentlayerDashboards = allDashboardDocs.map(fromContentlayer);
  const existing = new Set(contentlayerDashboards.map((dashboard) => dashboard.slug));
  const diskDashboards = readDiskDashboards().filter((dashboard) => !existing.has(dashboard.slug));

  return [...contentlayerDashboards, ...diskDashboards].sort((a, b) => a.title.localeCompare(b.title));
}

export function getDashboards(): Dashboard[] {
  return mergeDashboards();
}

export function getDashboardBySlug(slug: string): Dashboard | undefined {
  return mergeDashboards().find((doc) => doc.slug === slug);
}
