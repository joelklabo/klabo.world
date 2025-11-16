import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { access } from 'node:fs/promises';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

test('admin can create, view, and delete a link dashboard panel', async ({ page }) => {
  await loginAsAdmin(page);

  const title = `Playwright Dashboard ${Date.now()}`;
  const slug = slugify(title, { lower: true, strict: true });
  const summary = 'Automated dashboard used for Playwright coverage.';
  const externalUrl = 'https://dashboards.example.com/insights';
  const hostname = new URL(externalUrl).hostname;
  const repoRoot = path.resolve(process.cwd(), '..');
  const dashboardFile = path.resolve(repoRoot, 'content', 'dashboards', `${slug}.mdx`);

  await page.goto('/admin/dashboards/new');
  await page.getByTestId('dashboard-title').fill(title);
  await page.getByTestId('dashboard-summary-input').fill(summary);
  await page.getByTestId('dashboard-panel-type').selectOption('link');
  await page.getByTestId('dashboard-tags').fill('playwright, dashboards');
  await page.getByTestId('dashboard-external-url').fill(externalUrl);
  await page.getByTestId('dashboard-notes').fill('## Playwright notes\n\nThis dashboard was created by an automated test.');
  await page.getByTestId('dashboard-submit').click();

  await page.waitForURL(new RegExp(`/admin/dashboards/${slug}`), { timeout: 30000 });

  await expect.poll(async () => {
    try {
      await access(dashboardFile);
      return true;
    } catch {
      return false;
    }
  }, { timeout: 15000, intervals: [250] }).toBe(true);

  execSync('pnpm --filter app exec contentlayer build', { cwd: repoRoot, stdio: 'inherit' });
  await page.goto(`/admin/dashboards/${slug}`);
  await page.waitForSelector('[data-testid="dashboard-summary-text"]', { timeout: 20000 });
  await expect(page.getByTestId('dashboard-summary-text')).toHaveText(summary);
  await expect(page.getByRole('link', { name: `Open ${hostname}` })).toBeVisible();

  await page.getByRole('button', { name: 'Delete dashboard' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboards$/);
  await expect
    .poll(
      async () => {
        try {
          await access(dashboardFile);
          return false;
        } catch {
          return true;
        }
      },
      { timeout: 15000, intervals: [250] },
    )
    .toBe(true);
});
