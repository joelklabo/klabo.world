import fs from 'node:fs/promises';
import path from 'node:path';
import { allAppDocs, type AppDoc } from 'contentlayer/generated';
type AppsDirectoryLoader = () => Promise<string>;

const resolveAppsDirectory: AppsDirectoryLoader = async () => {
  const { getAppsDirectory } = await import('./appPersistence');
  return getAppsDirectory();
};

function getPublishDate(app: AppDoc): Date {
  return new Date(app.publishDate);
}

export function getApps(): AppDoc[] {
  const apps = Array.isArray(allAppDocs) ? allAppDocs : [];
  return [...apps].sort((a, b) => getPublishDate(b).getTime() - getPublishDate(a).getTime());
}

export function getAppBySlug(slug: string): AppDoc | undefined {
  return Array.isArray(allAppDocs) ? allAppDocs.find((app) => app.slug === slug) : undefined;
}

type AdminApp = {
  slug: string;
  name: string;
  version: string;
  publishDate: string;
  fullDescription: string;
  features: string[];
  icon?: string;
  screenshots?: string[];
  githubURL?: string;
  appStoreURL?: string;
};

function normalizeAdminApp(app: AppDoc): AdminApp {
  return {
    slug: app.slug,
    name: app.name,
    version: app.version,
    publishDate: app.publishDate,
    fullDescription: app.fullDescription,
    features: app.features ?? [],
    icon: app.icon ?? undefined,
    screenshots: app.screenshots ?? undefined,
    githubURL: app.githubURL ?? undefined,
    appStoreURL: app.appStoreURL ?? undefined,
  };
}

async function readDiskApps(exclude: Set<string>): Promise<AdminApp[]> {
  const dir = await resolveAppsDirectory();
  try {
    const files = await fs.readdir(dir);
    const results: AdminApp[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const slug = path.basename(file, '.json');
      if (exclude.has(slug)) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const parsed = JSON.parse(raw) as Partial<AdminApp>;
      results.push({
        slug,
        name: parsed.name ?? slug,
        version: parsed.version ?? '1.0.0',
        publishDate: parsed.publishDate ?? new Date().toISOString(),
        fullDescription: parsed.fullDescription ?? '',
        features: parsed.features ?? [],
        icon: parsed.icon,
        screenshots: parsed.screenshots,
        githubURL: parsed.githubURL,
        appStoreURL: parsed.appStoreURL,
      });
    }
    return results;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function getAppsForAdmin(): Promise<AdminApp[]> {
  const contentlayerApps = getApps().map(normalizeAdminApp);
  const existing = new Set(contentlayerApps.map((app) => app.slug));
  const diskApps = await readDiskApps(existing);
  return [...contentlayerApps, ...diskApps].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

export async function getEditableAppBySlug(slug: string): Promise<AdminApp | undefined> {
  const contentlayerApp = getAppBySlug(slug);
  if (contentlayerApp) {
    return normalizeAdminApp(contentlayerApp);
  }
  const dir = await resolveAppsDirectory();
  const filePath = path.join(dir, `${slug}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AdminApp>;
    return {
      slug,
      name: parsed.name ?? slug,
      version: parsed.version ?? '1.0.0',
      publishDate: parsed.publishDate ?? new Date().toISOString(),
      fullDescription: parsed.fullDescription ?? '',
      features: parsed.features ?? [],
      icon: parsed.icon,
      screenshots: parsed.screenshots,
      githubURL: parsed.githubURL,
      appStoreURL: parsed.appStoreURL,
    };
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
