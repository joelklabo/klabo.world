import { expect, test } from '@playwright/test';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

test.describe('admin contexts workflow', () => {
  test('can create and delete a context', async ({ page }) => {
    await loginAsAdmin(page);

    const title = `Playwright Context ${Date.now()}`;
    const slug = slugify(title, { lower: true, strict: true });
    const today = new Date().toISOString().slice(0, 10);

    await page.goto('/admin/contexts/new');
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Slug (optional)').fill(slug);
    await page.getByLabel('Summary').fill('Automated summary for Playwright context smoke test.');
    await page.getByLabel('Tags (comma or newline separated)').fill('playwright, contexts');
    await page.getByLabel('Created date').fill(today);
    await page.getByLabel('Updated date').fill(today);
    await page.getByLabel('Content (Markdown)').fill('# Context Body\n\nDetails for Playwright context test.');
    await page.getByRole('button', { name: 'Create context' }).click();

    await expect(page).toHaveURL(/\/admin\/contexts$/);
    const row = page.locator('tbody tr').filter({ hasText: title }).first();
    await expect(row).toBeVisible();

    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/contexts/${slug}/edit`));
    await page.getByRole('button', { name: 'Delete context' }).click();

    await expect(page).toHaveURL(/\/admin\/contexts$/);
    await expect(page.getByText(title)).toHaveCount(0);
  });
});
