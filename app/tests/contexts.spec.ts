import { describe, expect, it } from 'vitest';
import { getContexts, searchPublishedContexts, toContextMetadata } from '@/lib/contexts';

describe('contexts helpers', () => {
  it('converts contentlayer docs into API metadata', () => {
    const context = getContexts({ includeDrafts: true })[0];
    const metadata = toContextMetadata(context);
    expect(metadata.title).toBe(context.title);
    expect(metadata.slug).toBe(context.slug);
    expect(metadata.createdDate).toMatch(/T/);
    expect(metadata.tags).toBeTypeOf('object');
  });

  it('search finds contexts by keyword', () => {
    const results = searchPublishedContexts('ios');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((context) => context.slug.includes('ios'))).toBe(true);
    expect(results.length).toBeLessThanOrEqual(10);
  });
});
