import { getPostTagCounts } from './posts';

export type TagCount = { tag: string; count: number };

function toArray(record: Record<string, number>, limit?: number): TagCount[] {
  const entries = Object.entries(record)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
}

export function getPostTagCloud(limit?: number): TagCount[] {
  return toArray(getPostTagCounts(), limit);
}

export function getCombinedTagCloud(limit?: number): TagCount[] {
  const combined: Record<string, number> = {};
  const merge = (record: Record<string, number>) => {
    Object.entries(record).forEach(([tag, count]) => {
      combined[tag] = (combined[tag] ?? 0) + count;
    });
  };
  merge(getPostTagCounts());
  return toArray(combined, limit);
}
