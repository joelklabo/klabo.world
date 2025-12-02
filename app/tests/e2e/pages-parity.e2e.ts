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

const contextRoutes = [
  { slug: 'ios-development-best-practices', title: 'iOS Development Best Practices' },
  { slug: 'swift-vapor-development', title: 'Swift Vapor Web Development Context' },
];

test.describe('public content routes', () => {
  test('home page renders hero and sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Build confidently with agentic engineering/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read the latest' })).toHaveAttribute('href', '/posts');
    await expect(page.getByRole('heading', { name: 'Recent Articles' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects & Experiments' })).toBeVisible();
  });

  test('posts index shows known articles', async ({ page }) => {
    await page.goto('/posts');
    for (const post of postRoutes) {
      await expect(page.getByRole('link', { name: post.title })).toBeVisible();
    }
  });

  for (const post of postRoutes) {
    test(`post ${post.slug} renders title and summary`, async ({ page }) => {
      await page.goto(`/posts/${post.slug}`);
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

  test('contexts index and detail pages display content summaries', async ({ page }) => {
    await page.goto('/contexts');
    await expect(page.getByRole('heading', { name: 'Claude & MCP Context Library' })).toBeVisible();
    for (const context of contextRoutes) {
      await expect(page.getByRole('link', { name: context.title })).toBeVisible();
    }
    await page.goto(`/contexts/${contextRoutes[0].slug}`);
    await expect(page.getByRole('heading', { name: contextRoutes[0].title }).first()).toBeVisible();
  });

  test('search returns results for Claude', async ({ page }) => {
    await page.goto('/search?q=Claude');
    await expect(page.getByText('Find posts, apps, and contexts')).toBeVisible();
    const claudeResult = page.getByRole('link').filter({ hasText: /Claude/i }).first();
    await expect(claudeResult).toBeVisible();
  });
});
