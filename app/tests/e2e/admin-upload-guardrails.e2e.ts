import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './admin-utils';

const fixturesDir = path.resolve(__dirname, '../fixtures/uploads');
const validPng = path.join(fixturesDir, 'valid.png');
const invalidFile = path.join(fixturesDir, 'invalid.bin');
const repoRoot = path.resolve(__dirname, '../../..');
const screenshotsDir = path.join(repoRoot, 'docs', 'screenshots', 'hardening', 'uploads');

test('admin upload guardrails handle quarantine, invalid files, and rate limits', async ({ page }) => {
  let forceRateLimit = false;

  await page.route('**/admin/upload-image', async (route) => {
    if (forceRateLimit) {
      await route.fulfill({
        status: 429,
        headers: {
          'Retry-After': '42',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Too many uploads. Please try again later.',
          retryAfter: 42,
        }),
      });
      return;
    }
    await route.continue();
  });

  await loginAsAdmin(page);
  await page.goto('/admin/compose');
  await fs.mkdir(screenshotsDir, { recursive: true });

  const uploadButton = page.getByRole('button', { name: 'Upload image' });
  await expect(uploadButton).toBeVisible();
  const fileInput = uploadButton.locator('..').locator('input[type="file"]');
  await expect(fileInput).toHaveCount(1);

  const [validResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/admin/upload-image') && res.request().method() === 'POST'),
    fileInput.setInputFiles(validPng),
  ]);
  expect(validResponse.ok()).toBeTruthy();
  const validPayload = await validResponse.json();
  expect(validPayload.url).toBeTruthy();
  await expect(page.getByText(/Upload queued for scanning/i)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotsDir, 'quarantine.png') });

  if (validPayload.storage === 'local' && validPayload.filename) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'quarantine');
    const savedPath = path.join(uploadsDir, validPayload.filename);
    await fs.rm(savedPath, { force: true });
    await fs.rm(`${savedPath}.metadata.json`, { force: true });
  }

  const [invalidResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/admin/upload-image') && res.request().method() === 'POST'),
    fileInput.setInputFiles(invalidFile),
  ]);
  expect(invalidResponse.status()).toBe(400);
  await expect(page.getByText(/Invalid file/i)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotsDir, 'invalid-file.png') });

  forceRateLimit = true;
  const [rateLimitResponse] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/admin/upload-image') && res.request().method() === 'POST'),
    fileInput.setInputFiles(validPng),
  ]);
  expect(rateLimitResponse.status()).toBe(429);
  await expect(page.getByText(/Too many uploads/i)).toBeVisible();
  await expect(page.getByText(/Try again in 42s/i)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotsDir, 'rate-limit.png') });
});
