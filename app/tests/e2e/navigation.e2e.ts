import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'change-me';

test.describe('global navigation', () => {
  test('public nav links load key pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('global-nav-home')).toBeVisible();

    const links = ['global-nav-posts', 'global-nav-apps', 'global-nav-contexts'];
    for (const testId of links) {
      const link = page.getByTestId(testId);
      const href = await link.getAttribute('href');
      await Promise.all([page.waitForNavigation(), link.click()]);
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace('/', '\\/')));
      }
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('search dropdown appears with results', async ({ page }) => {
    await page.goto('/');
    const search = page.getByTestId('global-search-input');
    await search.click();
    await search.fill('nostr');
    await expect(page.getByTestId('global-search-results')).toBeVisible();
    await expect(page.getByTestId('global-search-results')).toContainText(/nostr/i);
  });
});

test.describe('admin navigation', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'ADMIN_EMAIL/PASSWORD not configured');

  test('login and navigate admin links', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByTestId('admin-login-form')).toBeVisible();

    await page.getByTestId('admin-login-email').fill(ADMIN_EMAIL);
    await page.getByTestId('admin-login-password').fill(ADMIN_PASSWORD);
    await Promise.all([page.waitForNavigation(), page.getByTestId('admin-login-submit').click()]);

    await expect(page).toHaveURL(/\/admin$/);
    const adminHeader = page.locator('header').filter({ hasText: 'Admin' });
    await expect(adminHeader.getByText(ADMIN_EMAIL)).toBeVisible();

    const adminNav = adminHeader.getByTestId('admin-nav');
    const adminLinks: Array<{ id: string; path: RegExp }> = [
      { id: 'dashboard', path: /\/admin$/ },
      { id: 'compose', path: /\/admin\/compose/ },
      { id: 'apps', path: /\/admin\/apps/ },
      { id: 'contexts', path: /\/admin\/contexts/ },
      { id: 'dashboards', path: /\/admin\/dashboards/ },
    ];

    for (const { id, path } of adminLinks) {
      const navLink = adminNav.getByTestId(`admin-nav-${id}`);
      await expect(navLink).toBeVisible();
      await navLink.click();
      await expect(page).toHaveURL(path);
      await page.waitForLoadState('networkidle');
    }

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByTestId('admin-login-form')).toBeVisible();
  });
});
