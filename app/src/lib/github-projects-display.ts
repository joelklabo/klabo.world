import { GitHubProject } from '@/lib/github-projects';
import { formatDisplayDate, parseDateInput } from '@/lib/dateDisplay';

const DEFAULT_PROJECT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function formatProjectDate(
  value: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_PROJECT_DATE_OPTIONS,
): string | null {
  const date = parseDateInput(value);
  if (!date) return null;
  return formatDisplayDate(date, null, options);
}

export function getProjectSortTime(project: Pick<GitHubProject, 'updatedAt' | 'pushedAt'>): number {
  const value = project.updatedAt ?? project.pushedAt;
  const date = parseDateInput(value);
  return date ? date.getTime() : 0;
}
