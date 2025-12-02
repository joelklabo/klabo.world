import { describe, expect, it } from 'vitest';
import { getCombinedTagCloud, getPostTagCloud } from '@/lib/tagCloud';

describe('tag cloud helpers', () => {
  it('returns sorted post tags with counts', () => {
    const tags = getPostTagCloud();
    expect(tags.length).toBeGreaterThan(0);
    expect(tags[0].count).toBeGreaterThanOrEqual(tags[1]?.count ?? 0);
  });

  it('combines post tags', () => {
    const combined = getCombinedTagCloud();
    const posts = getPostTagCloud();
    expect(combined.length).toBe(posts.length);
    expect(combined[0]?.tag).toBe(posts[0]?.tag);
  });
});
