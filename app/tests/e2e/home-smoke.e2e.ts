import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  DEFAULT_BITCOIN_ONCHAIN_ADDRESS,
  DEFAULT_LIGHTNING_NODE_ALIAS,
  DEFAULT_LIGHTNING_NODE_HOST,
  DEFAULT_LIGHTNING_NODE_PORT,
  DEFAULT_LIGHTNING_NODE_PUBKEY,
  SITE_NAME,
} from '@/lib/site-config';

const routes = ['/', '/posts', '/projects', '/apps', '/pay'];
const BTC_ADDRESS = DEFAULT_BITCOIN_ONCHAIN_ADDRESS;
const NODE_URI = `${DEFAULT_LIGHTNING_NODE_PUBKEY}@${DEFAULT_LIGHTNING_NODE_HOST}:${DEFAULT_LIGHTNING_NODE_PORT}`;
const NODE_URI_REGEX = new RegExp(`^lightning:${NODE_URI.replace(/\./g, '\\.')}$`);
const chainTipPayload = {
  network: 'mainnet',
  source: 'playwright',
  checkedAt: '2026-05-07T12:00:00.000Z',
  tip: {
    hash: '00000000000000000000632a2f3d0df0119d13f5b56736ae2932552bd6f99f48',
    height: 948_352,
    timestamp: 1_778_180_485,
    txCount: 2075,
    sizeBytes: 902_958,
    weight: 2_230_104,
    difficulty: 132_472_011_079_030.52,
    medianFeeSatVb: 1.4,
    poolName: 'Foundry USA',
  },
  recentBlocks: [
    {
      hash: '00000000000000000000632a2f3d0df0119d13f5b56736ae2932552bd6f99f48',
      height: 948_352,
      timestamp: 1_778_180_485,
      txCount: 2075,
      sizeBytes: 902_958,
      weight: 2_230_104,
      difficulty: 132_472_011_079_030.52,
      medianFeeSatVb: 1.4,
      poolName: 'Foundry USA',
    },
    {
      hash: '00000000000000000000f3164e185d6a60b537c32bbd7fc7c38ffc94155248d1',
      height: 948_351,
      timestamp: 1_778_180_108,
      txCount: 3411,
      sizeBytes: 1_517_351,
      weight: 3_993_863,
      difficulty: 132_472_011_079_030.52,
      medianFeeSatVb: 1.1,
      poolName: null,
    },
  ],
  mempool: {
    transactionCount: 42_000,
    vsize: 82_000_000,
    totalFeeSats: 12_000_000,
  },
  fees: {
    fastestFeeSatVb: 2,
    halfHourFeeSatVb: 1,
    hourFeeSatVb: 1,
    economyFeeSatVb: 1,
    minimumFeeSatVb: 1,
  },
};
const websocketBlockPayload = {
  blocks: [
    {
      id: '00000000000000000000d0e5aa8cd159983dfbd493a3d20561cce2f89d53c1f6',
      height: 948_353,
      timestamp: 1_778_182_415,
      tx_count: 4066,
      size: 1_563_806,
      weight: 3_995_057,
      difficulty: 132_472_011_079_030.52,
      extras: {
        medianFee: 4.2,
      },
    },
  ],
  mempoolInfo: {
    count: 56_600,
    vsize: 91_000_000,
    total_fee: 14_000_000,
  },
  fees: {
    fastestFee: 5,
    halfHourFee: 4,
    hourFee: 3,
    economyFee: 2,
    minimumFee: 1,
  },
};
const paymentCardTestIds = [
  'lightning-node-card',
  'lightning-tip-widget',
  'bitcoin-onchain-card',
] as const;

async function mockBitcoinWebSocket(page: Page) {
  await page.addInitScript((payload) => {
    const futureBlockPayload = {
      ...payload,
      blocks: payload.blocks.map((block, index) => ({
        ...block,
        timestamp: index === 0 ? Math.floor(Date.now() / 1000) + 600 : block.timestamp,
      })),
    };

    class MockWebSocket extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      readonly url = 'wss://mempool.space/api/v1/ws';
      readonly protocol = '';
      readonly extensions = '';
      binaryType: BinaryType = 'blob';
      bufferedAmount = 0;
      readyState = MockWebSocket.CONNECTING;
      onopen: ((this: WebSocket, event: Event) => unknown) | null = null;
      onmessage: ((this: WebSocket, event: MessageEvent) => unknown) | null = null;
      onerror: ((this: WebSocket, event: Event) => unknown) | null = null;
      onclose: ((this: WebSocket, event: CloseEvent) => unknown) | null = null;

      constructor() {
        super();
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          const openEvent = new Event('open');
          this.onopen?.call(this as unknown as WebSocket, openEvent);
          this.dispatchEvent(openEvent);

          setTimeout(() => {
            const messageEvent = new MessageEvent('message', {
              data: JSON.stringify(futureBlockPayload),
            });
            this.onmessage?.call(this as unknown as WebSocket, messageEvent);
            this.dispatchEvent(messageEvent);
          }, 1000);
        }, 0);
      }

      send() {}

      close() {
        this.readyState = MockWebSocket.CLOSED;
        const closeEvent = new CloseEvent('close');
        this.onclose?.call(this as unknown as WebSocket, closeEvent);
        this.dispatchEvent(closeEvent);
      }
    }

    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      writable: true,
      value: MockWebSocket as unknown as typeof WebSocket,
    });
  }, websocketBlockPayload);
}

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
      await expect(page).toHaveTitle(new RegExp(`^${SITE_NAME.replace(/\./g, '\\.')}$`, 'i'));
    });
  }

  test('shows the Lightning node widget and can request a tip invoice', async ({ page }) => {
    await page.route('**/api/lightning/node-status', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          alias: DEFAULT_LIGHTNING_NODE_ALIAS,
          pubkey: DEFAULT_LIGHTNING_NODE_PUBKEY,
          host: DEFAULT_LIGHTNING_NODE_HOST,
          port: DEFAULT_LIGHTNING_NODE_PORT,
          uri: NODE_URI,
          reachable: true,
          latencyMs: 42,
          checkedAt: '2026-05-04T01:00:00.000Z',
          source: 'tcp-connect',
        }),
      });
    });

    await page.route('**/api/bitcoin/chain-tip', async (route) => {
      await route.fulfill({ json: chainTipPayload });
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

    await expect(page.getByTestId('live-bitcoin-section')).toBeVisible();
    await expect(page.getByTestId('bitcoin-block-height')).toContainText('948,352');
    await expect(page.getByTestId('bitcoin-fee-estimate')).toContainText('2 sat/vB');
    await expect(page.getByTestId('bitcoin-last-block-age')).toBeVisible();
    await expect(page.getByTestId('bitcoin-connection-status')).toBeVisible();
    await expect(page.getByTestId('home-lightning-section')).toBeVisible();
    await expect(page.getByTestId('tip-custom-input')).toBeVisible();
    await expect(page.getByTestId('lightning-node-status')).toContainText('Online');
    await expect(page.getByText(/0276dc1e.*0a789a68/)).toBeVisible();
    await expect(page.getByRole('link', { name: /connect/i })).toHaveAttribute(
      'href',
      NODE_URI_REGEX,
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
    const bitcoinTop = await page
      .getByTestId('live-bitcoin-section')
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    const overviewTop = await page
      .getByTestId('home-section-overview')
      .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(bitcoinTop).toBeLessThan(paymentTop);
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

  test('updates the live Bitcoin section when a new block arrives', async ({ page }) => {
    await mockBitcoinWebSocket(page);
    await page.route('**/api/bitcoin/chain-tip', async (route) => {
      await route.fulfill({ json: chainTipPayload });
    });

    await page.goto('/');

    await expect(page.getByTestId('bitcoin-block-height')).toContainText('948,352');
    await expect(page.getByTestId('bitcoin-connection-status')).toContainText('Live socket');
    await expect(page.getByTestId('bitcoin-block-height')).toContainText('948,353');
    await expect(page.getByTestId('bitcoin-new-block-toast')).toContainText('948,353');
    await expect(page.getByTestId('bitcoin-fee-estimate')).toContainText('5 sat/vB');
    await expect
      .poll(async () => {
        const text = await page.getByTestId('bitcoin-last-block-age').textContent();
        return text?.trim() ?? '';
      })
      .toMatch(/^[1-9]\d*s$/);

    const progressWidth = await page
      .getByTestId('bitcoin-block-progress')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(progressWidth).toBeGreaterThan(0);
  });

  test('renders the mobile payment page without the global site chrome', async ({ page }) => {
    await page.route('**/api/lightning/node-status', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          alias: DEFAULT_LIGHTNING_NODE_ALIAS,
          pubkey: DEFAULT_LIGHTNING_NODE_PUBKEY,
          host: DEFAULT_LIGHTNING_NODE_HOST,
          port: DEFAULT_LIGHTNING_NODE_PORT,
          uri: NODE_URI,
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
    await expect(page.getByTestId('pay-page-title')).toHaveText(`Pay ${SITE_NAME}`);
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
