import { GitHubProject } from '@/lib/github-projects';

function parseProjectDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const DEFAULT_PROJECT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function formatProjectDate(
  value: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_PROJECT_DATE_OPTIONS,
): string | null {
  const date = parseProjectDate(value);
  if (!date) return null;
  const normalizedOptions = { ...options };
  try {
    return new Intl.DateTimeFormat(undefined, normalizedOptions).format(date);
  } catch {
    return date.toLocaleDateString(undefined, normalizedOptions);
  }
}

export function getProjectSortTime(project: Pick<GitHubProject, 'updatedAt' | 'pushedAt'>): number {
  const value = project.updatedAt ?? project.pushedAt;
  const date = parseProjectDate(value);
  return date ? date.getTime() : 0;
}
