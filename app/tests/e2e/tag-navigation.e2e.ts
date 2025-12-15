import { expect, test } from '@playwright/test';

test.describe('tag navigation', () => {
  test('post tag chip navigates to tag page', async ({ page }) => {
    await page.goto('/posts/tags');
    const tagLink = page.locator('a[href^="/posts/tag/"]').first();
    const href = await tagLink.getAttribute('href');
    expect(href).toBeTruthy();
    const tagText = decodeURIComponent(href!.split('/').at(-1)!).trim().toLowerCase();
    await tagLink.click();
    await expect(page).toHaveURL(/\/posts\/tag\//);
    const headingText = (await page.getByRole('heading', { level: 1 }).innerText()).trim().toLowerCase();
    expect(headingText).toBe(tagText);
  });
});
