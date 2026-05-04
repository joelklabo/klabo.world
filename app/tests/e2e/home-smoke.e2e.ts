import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const routes = ['/', '/posts', '/projects', '/apps', '/pay'];
const BTC_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';
const paymentCardTestIds = [
  'lightning-node-card',
  'lightning-tip-widget',
  'bitcoin-onchain-card',
] as const;

async function expectPaymentCardsSameHeight(page: Page) {
  const heights = await Promise.all(
    paymentCardTestIds.map((testId) =>
      page
        .getByTestId(testId)
        .evaluate((element) => Math.round(element.getBoundingClientRect().height)),
    ),
  );
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
}

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
    await expectPaymentCardsSameHeight(page);

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
    await page.getByTestId('mark-paid').click();
    await expect(page.getByTestId('tip-success')).toBeVisible();
    await expectPaymentCardsSameHeight(page);
  });

  test('renders the mobile payment page without the global site chrome', async ({ page }) => {
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
          latencyMs: 24,
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

    await page.route('**/api/tip-stats?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, totalSats: 0, largestTip: 0 }),
      });
    });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/pay');

    await expect(page.getByTestId('pay-page')).toBeVisible();
    await expect(page.getByTestId('pay-page-title')).toHaveText('Pay klabo.world');
    await expect(page.getByTestId('global-nav-logo')).toHaveCount(0);
    await expect(page.getByTestId('pay-lightning-status')).toContainText('Online');
    await expect(page.getByTestId('lightning-tip-widget')).toBeVisible();
    await expect(page.getByTestId('bitcoin-onchain-card')).toBeVisible();
    await expect(page.getByTestId('lightning-node-card')).toBeVisible();

    const layout = await page.evaluate(() => {
      const rectFor = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          width: Math.round(rect.width),
        };
      };

      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        tip: rectFor('[data-testid="lightning-tip-widget"]'),
        onchain: rectFor('[data-testid="bitcoin-onchain-card"]'),
        node: rectFor('[data-testid="lightning-node-card"]'),
      };
    });

    expect(layout.overflow).toBe(false);
    expect(layout.tip?.top).toBeLessThan(layout.onchain?.top ?? Number.POSITIVE_INFINITY);
    expect(layout.onchain?.top).toBeLessThan(layout.node?.top ?? Number.POSITIVE_INFINITY);
  });
});
