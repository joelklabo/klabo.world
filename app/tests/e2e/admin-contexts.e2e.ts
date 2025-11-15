import { execSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import slugify from 'slugify';
import { loginAsAdmin } from './admin-utils';

test.describe('admin contexts workflow', () => {
  test('can create, update, and delete a context while exercising APIs', async ({ page }) => {
    await loginAsAdmin(page);

    const title = `Playwright Context ${Date.now()}`;
    const slug = slugify(title, { lower: true, strict: true });
    const today = new Date().toISOString().slice(0, 10);
    const initialSummary = 'Automated summary for Playwright context smoke test.';
    const updatedSummary = 'Updated Playwright context summary for validation.';
    const initialContent = '# Context Body\n\nDetails for Playwright context test.';
    const updatedContent = '# Updated Body\n\nMore details after edit.';

    await page.goto('/admin/contexts/new');
    await page.getByTestId('contexts-new-title').fill(title);
    await page.getByTestId('contexts-new-slug').fill(slug);
    await page.getByTestId('contexts-new-summary').fill(initialSummary);
    await page.getByTestId('contexts-new-tags').fill('playwright, contexts');
    await page.getByTestId('contexts-new-created').fill(today);
    await page.getByTestId('contexts-new-updated').fill(today);
    await page.getByTestId('contexts-new-content').fill(initialContent);
    await page.getByTestId('contexts-new-submit').click();

    await expect(page).toHaveURL(/\/admin\/contexts$/);
    const row = page.locator('tbody tr').filter({ hasText: title }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('Published');

    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/contexts/${slug}/edit`));
    await page.getByTestId('contexts-edit-summary').fill(updatedSummary);
    await page.getByTestId('contexts-edit-tags').fill('playwright, contexts, updated');
    await page.getByTestId('contexts-edit-content').fill(updatedContent);
    await page.getByTestId('contexts-edit-status-published').check();
    await page.getByTestId('contexts-edit-submit').click();

    const listRow = page.locator('tbody tr').filter({ hasText: title });
    await expect(listRow).toBeVisible();
    await expect(listRow).toContainText('Published');

    const repoRoot = path.resolve(process.cwd(), '..');
    execSync('pnpm --filter app exec contentlayer build', { cwd: repoRoot, stdio: 'inherit' });
    const contextDetail = await page.request.get(`/api/contexts/${slug}`);
    expect(contextDetail.ok()).toBe(true);
    const contextJson = await contextDetail.json();
    expect(contextJson.metadata.slug).toBe(slug);
    expect(contextJson.metadata.summary).toBe(updatedSummary);

    const rawRes = await page.request.get(`/api/contexts/${slug}/raw`);
    expect(rawRes.ok()).toBe(true);
    expect(await rawRes.text()).toContain('# Updated Body');

    const searchResult = await page.request.get(`/api/contexts/search?q=${encodeURIComponent(slug.substring(0, 6))}`);
    expect(searchResult.ok()).toBe(true);
    const searchJson = await searchResult.json();
    expect(Array.isArray(searchJson)).toBe(true);
    expect(searchJson.some((item: { slug: string }) => item.slug === slug)).toBe(true);

    await listRow.getByRole('link', { name: 'Edit' }).click();
    await page.getByTestId('contexts-edit-status-draft').check();
    await page.getByTestId('contexts-edit-submit').click();
    const updatedRow = page.locator('tbody tr').filter({ hasText: title });
    await updatedRow.getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByTestId('contexts-edit-delete')).toBeVisible();
    await page.getByTestId('contexts-edit-delete').click();
    await expect(page).toHaveURL(/\/admin\/contexts$/);
  });
});
