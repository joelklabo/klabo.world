import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './admin-utils';

test('admin upload image endpoint stores a PNG and returns a public URL', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/compose');

  const fixture = path.resolve(__dirname, '../../..', 'test_image.png');
  const uploadButton = page.getByRole('button', { name: 'Upload image' });
  await expect(uploadButton).toBeVisible();
  const fileInput = uploadButton.locator('..').locator('input[type="file"]');
  await expect(fileInput).toHaveCount(1);

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/admin/upload-image') && res.request().method() === 'POST'),
    fileInput.setInputFiles(fixture),
  ]);

  const payload = await response.json();
  expect(payload.url).toBeTruthy();
  expect(typeof payload.storage).toBe('string');
  await expect(page.getByText(/^Uploaded!/)).toBeVisible();

  if (payload.storage === 'local' && payload.filename) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.rm(path.join(uploadsDir, payload.filename), { force: true });
  }
});
