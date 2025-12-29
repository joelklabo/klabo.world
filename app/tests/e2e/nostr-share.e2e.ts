import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('nostr share', () => {
  test('share button shows actionable error without NIP-07 signer', async ({ page }) => {
    const slug = 'agentically-engineering-past-procrastination';
    await page.goto(`/posts/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const shareActivity = page.getByTestId('nostrstack-share-activity');
    if (await shareActivity.count() === 0) {
      test.skip(true, 'Nostr widgets disabled for this post');
    }
    await expect(shareActivity).toBeVisible();
    const relayStatus = page.getByText(/Relays: mock|Relays ready|Relays \d+\/\d+|No relays connected/);
    if (await relayStatus.count()) {
      await relayStatus.first().waitFor({ state: 'visible' });
    }
    const share = page.getByTestId('nostrstack-share');
    if (await share.count() === 0) {
      test.skip(true, 'Nostr share button missing');
    }
    await expect(share).toBeVisible();
    await expect(share).toBeEnabled();
    await share.scrollIntoViewIfNeeded();
    await share.click({ trial: true });
    await share.click();
    await expect(
      page.getByText('NIP-07 signer not detected. Please enable your Nostr extension to share.'),
    ).toBeVisible();
    const screenshotsDir = process.env.PLAYWRIGHT_SCREENSHOTS_DIR;
    if (screenshotsDir) {
      await mkdir(screenshotsDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotsDir, 'nostr-share-actionable-error.png'),
        fullPage: true,
      });
    }
  });
});
