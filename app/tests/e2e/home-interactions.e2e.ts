import { expect, test } from '@playwright/test';

test.describe('home page interactions', () => {
  test('hero CTAs navigate to core sections', async ({ page }) => {
    await page.goto('/');

    await Promise.all([
      page.waitForNavigation(),
      page.getByTestId('home-cta-writing').click(),
    ]);
    await expect(page).toHaveURL(/\/posts/);

    await page.goto('/');
    await Promise.all([
      page.waitForNavigation(),
      page.getByTestId('home-cta-projects').click(),
    ]);
    await expect(page).toHaveURL(/\/projects/);
  });

  test('writing and GitHub cards are navigable', async ({ page }) => {
    await page.goto('/');

    const firstPost = page.getByTestId('home-writing-post').first();
    await expect(firstPost).toBeVisible();

    const postHref = await firstPost.getAttribute('href');
    expect(postHref).toMatch(/^\/posts\//);

    await Promise.all([page.waitForNavigation(), firstPost.click()]);
    await expect(page).toHaveURL(new RegExp(postHref!.replace('/', String.raw`\/`)));

    await page.goto('/');
    const featuredProject = page.getByTestId('home-github-featured');
    await expect(featuredProject).toBeVisible();
    await expect(featuredProject).toHaveAttribute('href', /github\.com/i);
    await expect(featuredProject).toHaveAttribute('target', '_blank');
  });
});
