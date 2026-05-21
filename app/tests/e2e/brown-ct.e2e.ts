import { expect, test } from '@playwright/test';

async function brokenVisibleImages(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const broken: Array<{ alt: string; src: string }> = [];

    const images = document.querySelectorAll('img');

    // eslint-disable-next-line unicorn/no-for-loop -- this repo's TS target does not allow iterating NodeList with for...of here.
    for (let index = 0; index < images.length; index += 1) {
      const img = images[index];
      if (img.id === 'lightboxImage') continue;
      const rect = img.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= innerHeight && rect.left <= innerWidth;
      if (visible && img.naturalWidth === 0) {
        broken.push({ alt: img.alt, src: img.currentSrc || img.src });
      }
    }

    return broken;
  });
}

test.describe('Brown Court history site', () => {
  test('renders packet content, search, source filter, and copied source assets', async ({ page, request }) => {
    const consoleMessages: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleMessages.push(message.text());
      }
    });
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    });

    const response = await page.goto('/brown-ct', { waitUntil: 'networkidle' });
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle('28 Brown Court — Petaluma’s Electrical Home');

    await expect(page.getByRole('heading', { name: /The Brown Court house/i })).toBeVisible();
    await expect(page.locator('.source-card')).toHaveCount(11);
    await expect(page.locator('.gallery-item')).toHaveCount(10);
    await expect(page.locator('.time-item')).toHaveCount(11);
    await expect(page.locator('#searchInput')).toBeVisible();
    expect(await brokenVisibleImages(page)).toEqual([]);

    await page.getByPlaceholder('Search names, dates, appliances, claims, source notes…').fill('Singleton');
    await expect(page.locator('#searchResults .result')).toHaveCount(2);
    await expect(page.locator('#searchResults')).toContainText('Singleton');

    await page.getByPlaceholder('Search names, dates, appliances, claims, source notes…').fill('Kameny');
    await expect(page.locator('#searchResults .result')).toHaveCount(2);
    await expect(page.locator('#searchResults')).toContainText('Kameny');

    await page.getByRole('button', { name: 'Address bridge' }).click();
    await expect(page.locator('.source-card')).toHaveCount(1);
    await expect(page.locator('#sourceGrid')).toContainText('Kameny');

    await page.getByRole('button', { name: 'All' }).click();
    const fullPageHref = await page.locator('.source-card').first().getByRole('link', { name: 'Full page' }).evaluate((anchor) => (anchor as HTMLAnchorElement).href);
    expect(fullPageHref).toContain('/brown-ct/sources/');
    const sourceResponse = await request.get(fullPageHref);
    expect(sourceResponse.status()).toBe(200);
    expect(sourceResponse.headers()['content-type']).toContain('image/jpeg');

    await page.locator('.source-card').first().getByRole('button', { name: 'View image' }).click();
    await expect(page.locator('#lightbox')).toHaveJSProperty('open', true);
    await expect(page.locator('#lightboxTitle')).toContainText('First Electrical Home ad / sponsor panel');
    await expect(page.locator('#lightboxFull')).not.toHaveAttribute('target', '_blank');
    const lightboxHref = await page.locator('#lightboxFull').evaluate((anchor) => (anchor as HTMLAnchorElement).href);
    expect(lightboxHref).toContain('/brown-ct/sources/');
    const lightboxImageWidth = await page.locator('#lightboxImage').evaluate((img) => (img as HTMLImageElement).naturalWidth);
    expect(lightboxImageWidth).toBeGreaterThan(0);

    expect(consoleMessages).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});
