import { expect, test } from '@playwright/test';

test.describe('seo endpoints', () => {
  test('serves sitemap with key routes', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toMatch(/<loc>.*<\/loc>/);
    expect(body).toMatch(/<loc>.*\/posts/);
  });

  test('serves robots with sitemap reference', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();

    const body = await response.text();
    expect(body).toMatch(/Sitemap:/i);
    expect(body).toMatch(/Disallow:\s*\/admin/i);
  });
});
