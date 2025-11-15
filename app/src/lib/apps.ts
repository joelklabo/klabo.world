import { allAppDocs, type AppDoc } from 'contentlayer/generated';

function getPublishDate(app: AppDoc): Date {
  return new Date(app.publishDate);
}

export function getApps(): AppDoc[] {
  return [...allAppDocs].sort((a, b) => getPublishDate(b).getTime() - getPublishDate(a).getTime());
}

export function getAppBySlug(slug: string): AppDoc | undefined {
  return allAppDocs.find((app) => app.slug === slug);
}
