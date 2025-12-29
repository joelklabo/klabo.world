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
    const shareCount = page.getByTestId('nostrstack-share-count');
    await expect(shareCount).toBeAttached();
    if (await shareCount.isVisible()) {
      await expect(shareCount).toHaveText('0');
    }

    const share = page.getByTestId('nostrstack-share');
    await expect(share).toBeVisible();
    await expect(share).toBeEnabled();

    await share.click();
    await expect(
      page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
    ).toBeVisible();
  });
});
