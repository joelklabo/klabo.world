export interface AdminPostSummary {
  slug: string;
  title: string;
  summary: string;
  tags?: string[];
  date: string;
  publishDate?: string | null;
  featuredImage?: string | null;
  lightningAddress?: string | null;
  nostrPubkey?: string | null;
  nostrRelays?: string[];
  nostrstackEnabled?: boolean | null;
  xPostId?: string | null;
}

type FrontmatterRecord = Record<string, unknown>;

export type PostSummaryDefaults = {
  slug: string;
  titleFallback: string;
  summaryFallback: string;
  date: string;
  featuredImage?: string | null;
  publishDateFallback?: string | null;
};

function toString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toStringArray(value: unknown, filterEmpty = false): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(String);
  return filterEmpty ? values.filter(Boolean) : values;
}

export function summarizePostMetadata(
  source: unknown,
  defaults: PostSummaryDefaults,
): AdminPostSummary {
  const data = source && typeof source === 'object' ? (source as FrontmatterRecord) : {};
  const fallbackPublishDate = defaults.publishDateFallback ?? null;

  return {
    slug: defaults.slug,
    title: toString(data.title) ?? defaults.titleFallback,
    summary: toString(data.summary) ?? defaults.summaryFallback,
    tags: toStringArray(data.tags),
    date: defaults.date,
    publishDate: toNullableString(data.publishDate) ?? fallbackPublishDate,
    featuredImage: toString(data.featuredImage) ?? defaults.featuredImage,
    lightningAddress: toNullableString(data.lightningAddress),
    nostrPubkey: toNullableString(data.nostrPubkey),
    nostrRelays: toStringArray(data.nostrRelays, true),
    nostrstackEnabled:
      typeof data.nostrstackEnabled === 'boolean' ? data.nostrstackEnabled : undefined,
    xPostId: toNullableString(data.xPostId),
  };
}
