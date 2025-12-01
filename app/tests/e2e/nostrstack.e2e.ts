import { test, expect } from '@playwright/test';

test('nostr widgets require a NIP-07 signer', async ({ page }) => {
  const slug = 'add-tipping-to-your-site-with-LNBits';
  await page.goto(`/posts/${slug}`);

  const shareButton = page.getByTestId('nostrstack-share');
  await expect(shareButton).toBeDisabled();
  await expect(
    page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
  ).toBeVisible();

  const commentBox = page.getByPlaceholder(/comment/i);
  await commentBox.fill('Hello from Playwright');
  const submit = page.getByTestId('nostrstack-comment-submit');
  await expect(submit).toBeDisabled();
  await expect(
    page.getByText(/NIP-07 signer not detected\. Install\/enable a Nostr browser extension/i),
  ).toBeVisible();
});
