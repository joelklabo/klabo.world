import { expect, test } from '@playwright/test';

test.describe('posts pages', () => {
  test('posts index shows cards and CTA', async ({ page }) => {
    await page.goto('/posts');

    await expect(page.getByRole('heading', { level: 1, name: /posts/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse tags/i })).toBeVisible();

    const cards = page.locator('article');
    const count = await cards.count();
    if (count === 0) {
      test.skip(true, 'No posts available');
    }

    const firstCard = cards.first();
    await expect(firstCard.getByRole('heading', { level: 2 })).toBeVisible();

    const tagChip = firstCard.locator('a[href^="/posts/tag/"]');
    if ((await tagChip.count()) > 0) {
      await expect(tagChip.first()).toBeVisible();
    }
  });

  test('tag pages render heading and post cards', async ({ page }) => {
    await page.goto('/posts/tags');

    await expect(page.getByRole('heading', { level: 1, name: /explore by topic/i })).toBeVisible();

    const tagLink = page.locator('a[href^="/posts/tag/"]').first();
    if ((await tagLink.count()) === 0) {
      test.skip(true, 'No tags available');
    }

    await Promise.all([page.waitForNavigation(), tagLink.click()]);
    await expect(page).toHaveURL(/\/posts\/tag\//);
    await expect(page.getByRole('link', { name: /back to all tags/i })).toBeVisible();

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    const cards = page.locator('article');
    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip(true, 'No posts for tag');
    }

    await expect(cards.first().getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('alias slug redirects to canonical post', async ({ page }) => {
    const response = await page.goto('/posts/introducing-ackchyally', { waitUntil: 'domcontentloaded' });
    expect(response, 'expected a response for the alias page').not.toBeNull();
    const responseBody = await response!.text();
    expect(responseBody).toContain('NEXT_REDIRECT;replace;/posts/introducing-ackchyually;308;');
    await page.waitForURL(/\/posts\/introducing-ackchyually/);
    await expect(page.getByRole('heading', { name: /ackchyually/i })).toBeVisible();
  });
});
