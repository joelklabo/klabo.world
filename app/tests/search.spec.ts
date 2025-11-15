import { describe, expect, it } from 'vitest';
import { searchContent } from '@/lib/search';

describe('searchContent', () => {
  it('returns empty results for short queries', () => {
    expect(searchContent('a')).toEqual([]);
  });

  it('finds posts/apps/contexts by keyword', () => {
    const results = searchContent('swift');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.type === 'post' || result.type === 'context' || result.type === 'app')).toBe(true);
  });
});
