import { expect, test } from '@playwright/test';

const routes = ['/', '/posts', '/apps', '/contexts'];

test.describe('public smoke', () => {
  for (const route of routes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/klabo\.world/i);
    });
  }
});
