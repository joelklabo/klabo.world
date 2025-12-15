import { expect, test } from '@playwright/test';

test.describe('nostr share', () => {
  test('share button shows actionable error without NIP-07 signer', async ({ page }) => {
    const slug = 'agentically-engineering-past-procrastination';
    await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });

    const share = page.getByTestId('nostrstack-share');
    await expect(share).toBeVisible();
    await expect(share).toBeEnabled();

    await share.click();
    await expect(
      page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
    ).toBeVisible();
  });
});
