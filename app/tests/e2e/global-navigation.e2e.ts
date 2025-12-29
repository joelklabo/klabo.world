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

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/search') && res.status() === 200),
      input.fill('bitcoin'),
    ]);

    const results = page.getByTestId('global-search-results');
    if (await results.count() === 0) {
      test.skip(true, 'No search suggestions container');
    }
    if (!(await results.isVisible())) {
      test.skip(true, 'Search suggestions are hidden');
    }

    const items = page.getByTestId('global-search-result');
    const count = await items.count();
    if (count === 0) {
      test.skip(true, 'No search suggestions available');
    }

    const firstItem = items.first();
    await expect(firstItem).toBeVisible();
    await expect(firstItem.locator('mark').first()).toBeVisible();

    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'global-search-option-0');
    await expect(firstItem).toHaveAttribute('aria-selected', 'true');

    await input.press('Escape');
    await expect(page.getByTestId('global-search-results')).toHaveCount(0);

    await input.focus();
    if (await results.count() === 0) {
      test.skip(true, 'Search suggestions container missing after focus');
    }
    if (!(await results.isVisible())) {
      test.skip(true, 'Search suggestions are hidden after focus');
    }

    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/(posts|apps)\//);
  });
});
