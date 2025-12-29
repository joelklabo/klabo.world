import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

test('nostr widgets require a NIP-07 signer', async ({ page }) => {
  const slug = 'add-tipping-to-your-site-with-LNBits';
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
  const screenshotsDir = process.env.PLAYWRIGHT_SCREENSHOTS_DIR;
  if (screenshotsDir) {
    await mkdir(screenshotsDir, { recursive: true });
    await shareActivity.screenshot({
      path: path.join(screenshotsDir, 'nostr-share-activity.png'),
    });
  }
  const omnoster = page.getByTestId('nostrstack-omnoster');
  if (await omnoster.count() === 0) {
    test.skip(true, 'Nostr omnoster missing');
  }
  if (!(await omnoster.isVisible())) {
    test.skip(true, 'Nostr omnoster hidden');
  }
  await expect(page.getByTestId('nostrstack-omnoster-item')).toHaveCount(0);

  const shareButton = page.getByTestId('nostrstack-share');
  if (await shareButton.count() === 0) {
    test.skip(true, 'Nostr share button missing');
  }
  await expect(shareButton).toBeEnabled();
  const shareMessage = page.getByText(
    'NIP-07 signer not detected. Please enable your Nostr extension to share.',
  );
  if (await shareMessage.count() === 0) {
    test.skip(true, 'Nostr share message missing');
  }
  if (!(await shareMessage.isVisible())) {
    test.skip(true, 'Nostr share message hidden');
  }

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
