import { expect, test } from '@playwright/test';

test.describe('apps pages', () => {
  test('apps index shows cards and metadata', async ({ page }) => {
    await page.goto('/apps');

    await expect(page.getByRole('heading', { level: 1, name: /projects & experiments/i })).toBeVisible();

    const cards = page.locator('a[href^="/apps/"]');
    const count = await cards.count();
    if (count === 0) {
      test.skip(true, 'No apps available');
    }

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByText(/version/i)).toBeVisible();
  });

  test('app detail renders CTAs and sections', async ({ page }) => {
    await page.goto('/apps');

    const appLink = page.locator('a[href^="/apps/"]').first();
    if ((await appLink.count()) === 0) {
      test.skip(true, 'No apps available');
    }

    await Promise.all([page.waitForNavigation(), appLink.click()]);
    await expect(page).toHaveURL(/\/apps\//);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to apps/i })).toBeVisible();

    const ctas = page.getByRole('link', { name: /view on (app store|github)/i });
    if ((await ctas.count()) > 0) {
      await expect(ctas.first()).toBeVisible();
    }
  });
});
