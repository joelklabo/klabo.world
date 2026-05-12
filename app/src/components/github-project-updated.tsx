import { formatProjectDate } from '@/lib/github-projects-display';
import { ContentDate } from '@/components/content-date';

const DEFAULT_GITHUB_PROJECT_UPDATED_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

type GitHubProjectUpdatedProps = {
  value?: string | null;
  label?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
};

export function GitHubProjectUpdatedDate({
  value,
  label = 'Updated',
  options = DEFAULT_GITHUB_PROJECT_UPDATED_OPTIONS,
  className,
}: GitHubProjectUpdatedProps) {
  if (!value) return null;
  const formatted = formatProjectDate(value, options);
  if (!formatted) return null;
  const rendered = label ? `${label} ${formatted}` : formatted;

  return (
    <ContentDate value={value} options={options} className={className}>
      {rendered}
    </ContentDate>
  );
}
