import { expect, test } from '@playwright/test';

test.describe('Phase 3 public APIs', () => {
  const gistId = '36cbd765b4a3a47c7a03cb2685de1162';
  const gistUrl = `/api/gists/joelklabo/${gistId}`;

  test('search, tags, health, and gist APIs return expected data', async ({ request }) => {
    const search = await request.get('/api/search?q=Claude');
    expect(search.ok()).toBe(true);
    const searchPayload = await search.json();
    expect(Array.isArray(searchPayload.results)).toBe(true);
    expect(searchPayload.results.length).toBeLessThanOrEqual(10);
    expect(searchPayload.meta?.total).toBe(searchPayload.results.length);

    const tags = await request.get('/api/tags?limit=5');
    expect(tags.ok()).toBe(true);
    const tagsPayload = await tags.json();
    expect(Array.isArray(tagsPayload.combined)).toBe(true);
    expect(tagsPayload.combined.length).toBeLessThanOrEqual(5);
    if (tagsPayload.combined.length > 0) {
      const knownTags = new Set(['ios', 'bitcoin', 'lightning']);
      const hasKnownTag = tagsPayload.combined.some((tag: { tag: string }) => knownTags.has(tag.tag.toLowerCase()));
      expect(hasKnownTag).toBe(true);
    }

    const health = await request.get('/api/health');
    expect(health.ok()).toBe(true);
    const healthPayload = await health.json();
    expect(healthPayload.status).toBe('ok');

    const gist = await request.get(gistUrl);
    expect(gist.ok()).toBe(true);
    const gistJson = await gist.json();
    expect(typeof gistJson.content).toBe('string');
    expect(typeof gistJson.filename).toBe('string');
  });
});
