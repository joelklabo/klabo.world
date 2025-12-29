import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './admin-utils';

test.describe('overflow surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('home page surfaces', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('projects page surfaces', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('projects.png', { fullPage: true });
  });

  test('admin dashboard surfaces', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true });
  });
});
