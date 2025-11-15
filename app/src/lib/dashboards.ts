import { allDashboardDocs, type DashboardDoc } from 'contentlayer/generated';

export type Dashboard = DashboardDoc;

export function getDashboards(): Dashboard[] {
  return [...allDashboardDocs].sort((a, b) => a.title.localeCompare(b.title));
}

export function getDashboardBySlug(slug: string): Dashboard | undefined {
  return allDashboardDocs.find((doc) => doc.slug === slug);
}
