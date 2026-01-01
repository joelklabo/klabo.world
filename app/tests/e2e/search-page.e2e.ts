import { expect, test } from '@playwright/test';

test.describe('search page', () => {
  test('short queries show helper text', async ({ page }) => {
    await page.goto('/search?q=a');
    await expect(page.getByText(/type at least two characters/i)).toBeVisible();
  });

  test('results render highlights and match labels', async ({ page }) => {
    await page.goto('/search?q=bitcoin');
    await page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/search' && url.searchParams.get('q') === 'bitcoin';
    });

    const resultCards = page.locator('a[href^="/posts/"], a[href^="/apps/"]');
    const count = await resultCards.count();
    if (count === 0) {
      await expect(page.getByText(/no results/i)).toBeVisible();
      test.skip(true, 'No results for search query');
    }

    const firstCard = resultCards.first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByText(/match:/i)).toBeVisible();
    await expect(firstCard.locator('mark').first()).toBeVisible();
  });

  test('empty results show empty state', async ({ page }) => {
    await page.goto('/search?q=unlikelyquerystring');
    await page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/search' && url.searchParams.get('q') === 'unlikelyquerystring';
    });
    await expect(page.getByText(/no results/i)).toBeVisible();
  });
});
