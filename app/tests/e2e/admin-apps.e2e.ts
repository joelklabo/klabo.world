import { expect, test } from '@playwright/test';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

test.describe('admin apps workflow', () => {
  test('can create and delete an app listing', async ({ page }) => {
    await loginAsAdmin(page);

    const name = `Playwright App ${Date.now()}`;
    const slug = slugify(name, { lower: true, strict: true });
    const publishDate = new Date().toISOString().slice(0, 10);

    await page.goto('/admin/apps/new');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Slug (optional)').fill(slug);
    await page.getByLabel('Version').fill('1.0.0');
    await page.getByLabel('Publish date').fill(publishDate);
    await page.getByLabel('Description').fill('Automated description for Playwright app smoke test.');
    await page.getByLabel('Features (one per line)').fill('Feature A\nFeature B');
    await page.getByLabel('App Store URL').fill('https://example.com/app-store');
    await page.getByLabel('GitHub URL').fill('https://github.com/example/app');
    await page.getByLabel('Icon path').fill('/uploads/icons/test-app.png');
    await page.getByLabel('Screenshots (one per line)').fill('/uploads/screens/test.png');
    await page.getByRole('button', { name: 'Create app' }).click();

    await expect(page).toHaveURL(/\/admin\/apps$/);
    const row = page.locator('tbody tr').filter({ hasText: name }).first();
    await expect(row).toBeVisible();

    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/apps/${slug}/edit`));
    await page.getByRole('button', { name: 'Delete app' }).click();

    await expect(page).toHaveURL(/\/admin\/apps$/);
    await expect(page.getByText(name)).toHaveCount(0);
  });
});
