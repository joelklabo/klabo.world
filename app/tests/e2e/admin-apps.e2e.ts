import { expect, test } from '@playwright/test';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

const today = new Date().toISOString().slice(0, 10);

test('admin can create, edit, and delete an app', async ({ page }) => {
  await loginAsAdmin(page);

  const name = `Playwright App ${Date.now()}`;
  const slug = slugify(name, { lower: true, strict: true });

  await page.goto('/admin/apps/new');
  await page.getByTestId('apps-new-name').fill(name);
  await page.getByTestId('apps-new-slug').fill(slug);
  await page.getByTestId('apps-new-version').fill('1.0.0');
  await page.getByTestId('apps-new-publish-date').fill(today);
  await page.getByTestId('apps-new-description').fill('Automated description for Playwright test.');
  await page.getByTestId('apps-new-features').fill('Feature one\nFeature two');
  await page.getByTestId('apps-new-appstore').fill('https://apps.apple.com/app/id1234567890');
  await page.getByTestId('apps-new-github').fill('https://github.com/joelklabo/klaboworld');
  await page.getByTestId('apps-new-icon').fill('/uploads/app-icons/test.png');
  await page.getByTestId('apps-new-screenshots').fill('/uploads/screens/app-01.png');
  await page.getByTestId('apps-new-submit').click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('/admin/apps');

  const row = page.locator('tbody tr').filter({ hasText: name }).first();
  await expect(row).toBeVisible({ timeout: 60_000 });

  const editLink = row.getByRole('link', { name: 'Edit' });
  await Promise.all([
    page.waitForURL(/\/admin\/apps\/.+\/edit/, { timeout: 60_000, waitUntil: 'domcontentloaded' }),
    editLink.click(),
  ]);

  await page.getByTestId('apps-edit-version').fill('1.0.1');
  await page.getByTestId('apps-edit-submit').click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto('/admin/apps');

  await page.locator('tbody tr').filter({ hasText: name }).first().getByRole('link', { name: 'Edit' }).click();

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.getByTestId('apps-edit-delete').click(),
  ]);

  await expect
    .poll(
      async () => {
        await page.goto(`/admin/apps?ts=${Date.now()}`);
        return page.locator('tbody tr').filter({ hasText: name }).count();
      },
      { timeout: 60_000, intervals: [1000, 1500, 2500] },
    )
    .toBe(0);
});
