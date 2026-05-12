import { allAppDocs, type AppDoc } from 'contentlayer/generated';
import { readDiskRecord, readDiskRecords } from './readDiskRecords';
type AppsDirectoryLoader = () => Promise<string>;

const resolveAppsDirectory: AppsDirectoryLoader = async () => {
  const { getAppsDirectory } = await import('./appPersistence');
  return getAppsDirectory();
};

function getPublishDate(app: AppDoc): Date {
  return new Date(app.publishDate);
}

function currentTimestamp() {
  return new Date().toISOString();
}

function normalizeAdminAppPayload(slug: string, app: Partial<AdminApp>): AdminApp {
  return {
    slug,
    name: app.name ?? slug,
    version: app.version ?? '1.0.0',
    publishDate: app.publishDate ?? currentTimestamp(),
    fullDescription: app.fullDescription ?? '',
    features: app.features ?? [],
    icon: app.icon,
    screenshots: app.screenshots,
    githubURL: app.githubURL,
    appStoreURL: app.appStoreURL,
  };
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
  return readDiskRecords({
    getDirectory: resolveAppsDirectory,
    extension: '.json',
    exclude,
    parseRecord: ({ slug, raw }) => {
      const parsed = JSON.parse(raw) as Partial<AdminApp>;
      return normalizeAdminAppPayload(slug, parsed);
    },
  });
}

export async function getAppsForAdmin(): Promise<AdminApp[]> {
  const contentlayerApps = getApps().map(normalizeAdminApp);
  const existing = new Set(contentlayerApps.map((app) => app.slug));
  const diskApps = await readDiskApps(existing);
  return [...contentlayerApps, ...diskApps].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
}

async function readDiskAppBySlug(slug: string): Promise<AdminApp | undefined> {
  return readDiskRecord({
    getDirectory: resolveAppsDirectory,
    extension: '.json',
    slug,
    parseRecord: ({ slug, raw }) => {
      const parsed = JSON.parse(raw) as Partial<AdminApp>;
      return normalizeAdminAppPayload(slug, parsed);
    },
  });
}

export async function getEditableAppBySlug(slug: string): Promise<AdminApp | undefined> {
  const contentlayerApp = getAppBySlug(slug);
  if (contentlayerApp) {
    return normalizeAdminApp(contentlayerApp);
  }
  return readDiskAppBySlug(slug);
}
