import { test, expect } from '@playwright/test';

test('nostr widgets require a NIP-07 signer', async ({ page }) => {
  const slug = 'add-tipping-to-your-site-with-LNBits';
  await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });

  const shareActivity = page.getByTestId('nostrstack-share-activity');
  if (await shareActivity.count() === 0) {
    test.skip(true, 'Nostr widgets disabled for this post');
  }
  await expect(shareActivity).toBeAttached();
  const shareCount = page.getByTestId('nostrstack-share-count');
  if (await shareCount.count() && await shareCount.isVisible()) {
      await expect(shareCount).toHaveText('0');
    }
  await expect(page.getByTestId('nostrstack-omnoster')).toBeAttached();
  await expect(page.getByTestId('nostrstack-omnoster-item')).toHaveCount(0);

  const shareButton = page.getByTestId('nostrstack-share');
  if (await shareButton.count() === 0) {
    test.skip(true, 'Nostr share button missing');
  }
  await expect(shareButton).toBeEnabled();
  await expect(
    page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
  ).toBeVisible();

  const commentBox = page.getByPlaceholder(/comment/i);
  const submit = page.getByTestId('nostrstack-comment-submit');
  if (await commentBox.count() === 0 || (await submit.count()) === 0) {
    test.skip(true, 'Nostr comment UI missing');
  }
  await expect(submit).toBeDisabled();
  await expect(
    page.getByText(/NIP-07 signer not detected\. Install\/enable a Nostr browser extension/i),
  ).toBeVisible();
});
