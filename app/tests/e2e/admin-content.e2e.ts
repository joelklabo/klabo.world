import { expect, test } from '@playwright/test';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

test.describe('admin content workflow', () => {
  test('can login, create, and delete a post', async ({ page }) => {
    await loginAsAdmin(page);

    const title = `Playwright Draft ${Date.now()}`;
    const slug = slugify(title, { lower: true, strict: true });

    await page.goto('/admin/compose');
    await expect(page).toHaveURL(/\/admin\/compose$/, { timeout: 60_000 });

    const titleField = page.getByLabel('Title');
    await expect(titleField).toBeVisible({ timeout: 60_000 });
    await titleField.fill(title);
    await page.getByLabel('Summary').fill('Automated summary for Playwright smoke test.');
    await page.getByLabel('Tags (comma-separated)').fill('playwright, automation');
    await page.getByLabel('Publish date').fill(new Date().toISOString().slice(0, 10));
    await page.getByLabel('Featured image path').fill('/uploads/test.png');
    await page.getByLabel('Content (Markdown)').fill('# Test Post\n\nThis is a Playwright-created post.');
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/admin', { timeout: 60_000, waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Publish post' }).click(),
    ]);

    const row = page.locator('tbody tr').filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 60_000 });

    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/posts/${slug}/edit`));

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/admin', { timeout: 60_000, waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Delete' }).click(),
    ]);

    const deletedRow = page.locator('tbody tr').filter({ hasText: title });
    await expect(deletedRow).toHaveCount(0, { timeout: 60_000 });
  });
});
