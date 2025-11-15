import { describe, expect, it } from 'vitest';
import { getPostTagCloud, getContextTagCloud, getCombinedTagCloud } from '@/lib/tagCloud';

describe('tag cloud helpers', () => {
  it('returns sorted post tags with counts', () => {
    const tags = getPostTagCloud();
    expect(tags.length).toBeGreaterThan(0);
    expect(tags[0].count).toBeGreaterThanOrEqual(tags[1]?.count ?? 0);
  });

  it('limits results when requested', () => {
    const tags = getContextTagCloud(1);
    expect(tags).toHaveLength(1);
  });

  it('combines post/context tags', () => {
    const tags = getCombinedTagCloud();
    expect(tags.some((tag) => tag.count > 1)).toBe(true);
  });
});
