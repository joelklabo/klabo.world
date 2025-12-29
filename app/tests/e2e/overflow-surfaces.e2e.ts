import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './admin-utils';

test.describe('overflow surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  function assertSnapshotAvailable(snapshotName: string) {
    const snapshotFile = `${snapshotName}-chromium-${process.platform}.png`;
    const snapshotPath = path.join(__dirname, 'overflow-surfaces.e2e.ts-snapshots', snapshotFile);
    test.skip(!fs.existsSync(snapshotPath), `Missing snapshot ${snapshotFile}`);
  }

  test('home page surfaces', async ({ page }) => {
    assertSnapshotAvailable('home');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('projects page surfaces', async ({ page }) => {
    assertSnapshotAvailable('projects');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('projects.png', { fullPage: true });
  });

  test('admin dashboard surfaces', async ({ page }) => {
    assertSnapshotAvailable('admin-dashboard');
    await loginAsAdmin(page);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true });
  });
});
