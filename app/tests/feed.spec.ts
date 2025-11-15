import { describe, expect, it } from 'vitest';
import { buildJsonFeed, buildRssFeed } from '@/lib/feed';

describe('feed builders', () => {
  it('builds RSS feed with posts', () => {
    const rss = buildRssFeed(1);
    expect(rss).toContain('<?xml version="1.0"');
    expect(rss).toContain('<rss');
    expect(rss).toContain('<item>');
  });

  it('builds JSON feed with metadata', () => {
    const feed = buildJsonFeed(1);
    expect(feed.title).toBeTruthy();
    expect(feed.items.length).toBeGreaterThan(0);
  });
});
