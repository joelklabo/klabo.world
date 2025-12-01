import { test, expect } from '@playwright/test';

// Stub navigator.share for deterministic share flow
// Playwright isolates contexts, so set in test via addInitScript.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error allow monkey patch in tests
    navigator.share = () => Promise.resolve();
  });
});

test('post page renders nostrstack widgets in mock mode', async ({ page }) => {
  const slug = 'add-tipping-to-your-site-with-LNBits';
  await page.goto(`/posts/${slug}`);

  // Tip button should generate a mock invoice
  const tipButton = page.getByTestId('nostrstack-tip');
  await tipButton.click();
  await expect(page.locator('text=lnbc1mock')).toBeVisible();

  // Share button should switch to shared state
  const shareButton = page.getByTestId('nostrstack-share');
  await shareButton.click();
  await expect(shareButton).toBeVisible();

  // Comments should accept a mock post without NIP-07
  const commentBox = page.getByPlaceholder(/comment/i);
  await commentBox.fill('Hello from Playwright');
  await page.getByTestId('nostrstack-comment-submit').click();
  await expect(page.locator('text=Hello from Playwright')).toBeVisible();
});
