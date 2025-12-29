import { expect, test } from '@playwright/test';

test.describe('nostr share', () => {
  test('share button shows actionable error without NIP-07 signer', async ({ page }) => {
    const slug = 'agentically-engineering-past-procrastination';
    await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });

    const shareActivity = page.getByTestId('nostrstack-share-activity');
    if (await shareActivity.count() === 0) {
      test.skip(true, 'Nostr widgets disabled for this post');
    }
    await expect(shareActivity).toBeAttached();
    const share = page.getByTestId('nostrstack-share');
    if (await share.count() === 0) {
      test.skip(true, 'Nostr share button missing');
    }
    const shareCount = page.getByTestId('nostrstack-share-count');
    if (await shareCount.count() && await shareCount.isVisible()) {
        await expect(shareCount).toHaveText('0');
      }
    await expect(share).toBeVisible();
    await expect(share).toBeEnabled();

    await share.click();
    await expect(
      page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
    ).toBeVisible();
  });
});
