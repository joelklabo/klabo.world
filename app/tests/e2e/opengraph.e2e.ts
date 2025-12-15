import { expect, test } from '@playwright/test';

test.describe('open graph metadata', () => {
  test('home page renders OG + twitter meta tags', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /klabo\.world/i);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /bitcoin/i);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /opengraph-image/);

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('meta[name="twitter:image"]').first()).toHaveAttribute('content', /opengraph-image/);

    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(ogImage).toBeTruthy();

    const res = await page.request.get(ogImage!);
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toMatch(/image\//);
  });

  test('post pages render post-specific OG image', async ({ page }) => {
    const slug = 'agentically-engineering-past-procrastination';
    await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /Agentically Engineering Past Procrastination/);

    const ogImage = page.locator('meta[property="og:image"]').first();
    await expect(ogImage).toHaveAttribute('content', new RegExp(`/posts/${slug}/opengraph-image`));

    const imageUrl = await ogImage.getAttribute('content');
    expect(imageUrl).toBeTruthy();

    const res = await page.request.get(imageUrl!);
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toMatch(/image\//);
  });
});

