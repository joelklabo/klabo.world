import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { allDashboardDocs, type DashboardDoc } from 'contentlayer/generated';
import { DASHBOARD_PANEL_TYPES, isDashboardPanelType, type DashboardPanelType } from './dashboardPanelTypes';

type FrontMatterFile = ReturnType<typeof matter>;

type DashboardsDirectoryLoader = () => Promise<string>;

const resolveDashboardsDirectory: DashboardsDirectoryLoader = async () => {
  const { getDashboardsDirectory } = await import('./dashboardPersistence');
  return getDashboardsDirectory();
};

export type Dashboard = {
  slug: string;
  title: string;
  summary: string;
  panelType?: DashboardPanelType | null;
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
    panelType: isDashboardPanelType(doc.panelType) ? doc.panelType : DASHBOARD_PANEL_TYPES.chart,
    tags: doc.tags ?? [],
    chartType: doc.chartType ?? null,
    iframeUrl: doc.iframeUrl ?? null,
    externalUrl: doc.externalUrl ?? null,
    refreshIntervalSeconds: doc.refreshIntervalSeconds ?? null,
    kqlQuery: doc.kqlQuery ?? null,
    body: { raw: doc.body.raw },
  };
}

function toDashboardFromFrontmatter(slug: string, parsed: FrontMatterFile): Dashboard {
  const data = parsed.data as Record<string, unknown>;
  const panelType =
    typeof data.panelType === 'string' && isDashboardPanelType(data.panelType) ? data.panelType : undefined;

  return {
    slug,
    title: typeof data.title === 'string' ? data.title : slug,
    summary: typeof data.summary === 'string' ? data.summary : '',
    panelType,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    chartType: typeof data.chartType === 'string' ? data.chartType : undefined,
    iframeUrl: typeof data.iframeUrl === 'string' ? data.iframeUrl : undefined,
    externalUrl: typeof data.externalUrl === 'string' ? data.externalUrl : undefined,
    refreshIntervalSeconds:
      typeof data.refreshIntervalSeconds === 'number' ? data.refreshIntervalSeconds : undefined,
    kqlQuery: typeof data.kqlQuery === 'string' ? data.kqlQuery : undefined,
    body: { raw: parsed.content.trim() },
  } satisfies Dashboard;
}

async function readDiskDashboards(existing: Set<string>): Promise<Dashboard[]> {
  const dir = await resolveDashboardsDirectory();
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
      if (existing.has(slug)) {
        return null;
      }
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const parsed = matter(raw);
      return toDashboardFromFrontmatter(slug, parsed);
    })
    .filter((dashboard): dashboard is Dashboard => dashboard !== null);
}

function fromContentlayerDashboards(): Dashboard[] {
  return allDashboardDocs.map(fromContentlayer);
}

function mergeDashboards(contentlayerDashboards: Dashboard[], diskDashboards: Dashboard[]): Dashboard[] {
  return [...contentlayerDashboards, ...diskDashboards].sort((a, b) => a.title.localeCompare(b.title));
}

function findDashboardBySlug(dashboards: Dashboard[], slug: string): Dashboard | undefined {
  return dashboards.find((dashboard) => dashboard.slug === slug);
}

export function getDashboards(): Dashboard[] {
  return mergeDashboards(fromContentlayerDashboards(), []);
}

export async function getDashboardsForAdmin(): Promise<Dashboard[]> {
  const contentlayerDashboards = fromContentlayerDashboards();
  const existing = new Set(contentlayerDashboards.map((dashboard) => dashboard.slug));
  const diskDashboards = await readDiskDashboards(existing);

  return mergeDashboards(contentlayerDashboards, diskDashboards);
}

export function getDashboardBySlug(slug: string): Dashboard | undefined {
  return findDashboardBySlug(fromContentlayerDashboards(), slug);
}

export async function getDashboardBySlugForAdmin(slug: string): Promise<Dashboard | undefined> {
  const dashboards = await getDashboardsForAdmin();
  return findDashboardBySlug(dashboards, slug);
}
