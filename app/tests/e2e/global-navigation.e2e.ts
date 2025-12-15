import { expect, test } from '@playwright/test';

test.describe('global navigation', () => {
  test('home uses compact search affordance', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('global-search-link')).toBeVisible();
    await expect(page.getByTestId('global-search-input')).toHaveCount(0);

    await Promise.all([
      page.waitForNavigation(),
      page.getByTestId('global-search-link').click(),
    ]);
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('heading', { name: /find posts and apps/i })).toBeVisible();
  });

  test('search suggestions appear from posts page', async ({ page }) => {
    await page.goto('/posts');

    const input = page.getByTestId('global-search-input');
    await expect(input).toBeVisible();

    await input.fill('agentic');
    await expect(page.getByTestId('global-search-results')).toBeVisible();
    await expect(page.getByTestId('global-search-result').first()).toBeVisible();
  });
});

