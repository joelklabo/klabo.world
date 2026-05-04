import { expect, test } from '@playwright/test';

const routes = ['/', '/posts', '/projects', '/apps'];
const BTC_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';

test.describe('public smoke', () => {
  for (const route of routes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/klabo\.world/i);
    });
  }

  test('shows the Lightning node widget and can request a tip invoice', async ({ page }) => {
    await page.route('**/api/lightning/node-status', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          alias: 'klabo.world',
          pubkey: '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68',
          host: 'lnbits.klabo.world',
          port: 9735,
          uri: '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68@lnbits.klabo.world:9735',
          reachable: true,
          latencyMs: 42,
          checkedAt: '2026-05-04T01:00:00.000Z',
          source: 'tcp-connect',
        }),
      });
    });

    await page.route('**/api/bitcoin/onchain-address', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          address: BTC_ADDRESS,
          uri: `bitcoin:${BTC_ADDRESS}`,
          source: 'rotating-pool',
          poolSize: 31,
          rotation: 'daily',
          index: 0,
        }),
      });
    });

    await page.route(/\/api\/lnurlp\/joel\/invoice\?.*/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          pr: 'lnbc1testinvoiceforplaywright',
          routes: [],
          payment_hash: 'abcdef1234567890',
        }),
      });
    });

    await page.route('**/api/lnurlp/check/**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ paid: false }),
      });
    });

    await page.route('**/api/tip-stats?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, totalSats: 0, largestTip: 0 }),
      });
    });

    await page.goto('/');

    await expect(page.getByTestId('home-lightning-section')).toBeVisible();
    await expect(page.getByTestId('tip-custom-input')).toBeVisible();
    await expect(page.getByTestId('lightning-node-status')).toContainText('Online');
    await expect(page.getByText(/0276dc1e.*0a789a68/)).toBeVisible();
    await expect(page.getByRole('link', { name: /connect/i })).toHaveAttribute(
      'href',
      /^lightning:0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68@lnbits\.klabo\.world:9735$/
    );
    await expect(page.getByTestId('bitcoin-onchain-card')).toBeVisible();
    await expect(page.getByTestId('bitcoin-onchain-address')).toContainText(/bc1qzafw/);
    await expect(page.getByTestId('open-onchain-wallet')).toHaveAttribute(
      'href',
      `bitcoin:${BTC_ADDRESS}`
    );

    const paymentTop = await page
      .getByTestId('home-lightning-section')
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    const overviewTop = await page
      .getByTestId('home-section-overview')
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(paymentTop).toBeLessThan(overviewTop);

    await page.getByRole('button', { name: /21\s*sats/i }).click();

    await expect(page.getByText(/lnbc1testinvoiceforplay/)).toBeVisible();
    await expect(page.getByTestId('open-wallet')).toHaveAttribute(
      'href',
      'lightning:lnbc1testinvoiceforplaywright'
    );
  });
});
