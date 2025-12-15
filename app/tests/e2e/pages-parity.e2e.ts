import { expect, test } from '@playwright/test';

const postRoutes = [
  {
    slug: 'add-tipping-to-your-site-with-LNBits',
    title: 'Add Tipping to your Site with LNBits',
    summary:
      'Learn how to add Lightning tipping to your blog using LNBits on a cheap VPS with CoreLightning and Trustedcoin, avoiding expensive full node hosting.',
  },
  {
    slug: 'setting-up-lightning-address-with-cln',
    title: 'Setting up Lightning Address with Core Lightning',
    summary:
      'Tutorial on setting up a Lightning address using Core Lightning (CLN) with LNBits and Satdress for easy Bitcoin payments.',
  },
];

test.describe('public content routes', () => {
  test('home page renders hero and sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-hero-title')).toBeVisible();
    await expect(page.getByTestId('home-cta-writing')).toHaveAttribute('href', '/posts');
    await expect(page.getByTestId('home-cta-projects')).toHaveAttribute('href', '/projects');
    await expect(page.getByTestId('home-section-writing')).toBeVisible();
    await expect(page.getByTestId('home-writing-post').first()).toBeVisible();
    await expect(page.getByTestId('home-section-projects')).toBeVisible();
    await expect(
      page
        .getByTestId('home-github-featured')
        .or(page.getByText('GitHub projects are temporarily unavailable')),
    ).toBeVisible();

    await Promise.all([page.waitForNavigation(), page.getByTestId('home-cta-projects').click()]);
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: 'GitHub projects' })).toBeVisible();
  });

  test('posts index shows known articles', async ({ page }) => {
    await page.goto('/posts');
    for (const post of postRoutes) {
      await expect(page.getByRole('link', { name: post.title })).toBeVisible();
    }
  });

  for (const post of postRoutes) {
    test(`post ${post.slug} renders title and summary`, async ({ page }) => {
      await page.goto(`/posts/${post.slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: post.title })).toBeVisible();
      await expect(page.getByText(post.summary).first()).toBeVisible();
    });
  }

  test('apps index shows ViceChips card', async ({ page }) => {
    await page.goto('/apps');
    await expect(page.getByRole('heading', { name: 'Projects & Experiments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ViceChips' })).toBeVisible();
  });

  test('ViceChips detail page renders description', async ({ page }) => {
    await page.goto('/apps/vicechips');
    await expect(page.getByRole('heading', { name: 'ViceChips' })).toBeVisible();
    await expect(page.getByText(/ViceChips is a modern iOS habit tracking app/)).toBeVisible();
  });

  test('search returns results for Claude', async ({ page }) => {
    await page.goto('/search?q=Claude');
    await expect(page.getByText('Find posts and apps')).toBeVisible();
    const claudeResult = page.getByRole('link').filter({ hasText: /Claude/i }).first();
    await expect(claudeResult).toBeVisible();
  });
});
