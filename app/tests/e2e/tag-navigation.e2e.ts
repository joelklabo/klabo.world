import { expect, test } from '@playwright/test';

test.describe('tag navigation', () => {
  test('post tag chip navigates to tag page', async ({ page }) => {
    await page.goto('/');
    const tagLink = page.locator('a[href^="/posts/tag/"]').first();
    const tagText = (await tagLink.innerText()).trim().toLowerCase();
    await Promise.all([page.waitForNavigation(), tagLink.click()]);
    await expect(page).toHaveURL(/\/posts\/tag\//);
    const headingText = (await page.getByRole('heading', { level: 1 }).innerText()).trim().toLowerCase();
    expect(headingText).toBe(tagText);
  });
});
