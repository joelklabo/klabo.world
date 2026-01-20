import { Page, expect } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'change-me';

export async function loginAsAdmin(page: Page) {
  await page.goto('/admin');

  const nav = page.getByTestId('admin-nav');
  const loginForm = page.getByTestId('admin-login-form');

  if (await nav.isVisible().catch(() => false)) {
    return;
  }

  await expect(loginForm).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('admin-login-email').fill(adminEmail);
  await page.getByTestId('admin-login-password').fill(adminPassword);

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.getByTestId('admin-login-submit').click(),
  ]);

  await expect(nav).toBeVisible({ timeout: 60_000 });
}
