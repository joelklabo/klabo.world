import { expect, test } from '@playwright/test';

const routes = ['/', '/posts', '/projects', '/apps'];

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
          host: 'klabo.world',
          port: 9735,
          uri: '0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68@klabo.world:9735',
          reachable: true,
          latencyMs: 42,
          checkedAt: '2026-05-04T01:00:00.000Z',
          source: 'tcp-connect',
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

    await page.goto('/');

    await expect(page.getByTestId('home-lightning-section')).toBeVisible();
    await expect(page.getByTestId('lightning-node-status')).toContainText('Online');
    await expect(page.getByText(/0276dc1e.*0a789a68/)).toBeVisible();
    await expect(page.getByRole('link', { name: /connect/i })).toHaveAttribute(
      'href',
      /^lightning:0276dc1ed542d0d777b518f1bd05f042847f19f312718cf1303288119a0a789a68@klabo\.world:9735$/
    );

    await page.getByRole('button', { name: /21\s*sats/i }).click();

    await expect(page.getByText(/lnbc1testinvoiceforplay/)).toBeVisible();
    await expect(page.getByRole('link', { name: /pay 21 sats/i }).last()).toHaveAttribute(
      'href',
      'lightning:lnbc1testinvoiceforplaywright'
    );
  });
});
