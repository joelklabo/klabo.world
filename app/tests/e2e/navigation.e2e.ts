import { expect, test } from '@playwright/test';

test('global navigation and search autocomplete are available', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('global-nav-logo')).toBeVisible();
  await expect(page.getByTestId('global-nav-posts')).toBeVisible();
  await expect(page.getByTestId('global-nav-apps')).toBeVisible();
  await expect(page.getByTestId('global-nav-contexts')).toBeVisible();
  await expect(page.getByTestId('global-nav-dashboards')).toBeVisible();
  await expect(page.getByTestId('global-nav-admin')).toBeVisible();

  const searchInput = page.getByTestId('global-search-input');
  await searchInput.fill('Claude');
  await page.waitForSelector('[data-testid="global-search-result"]', { timeout: 10000 });
  await expect(page.getByTestId('global-search-result').first()).toBeVisible();
  await searchInput.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=Claude/);
});
