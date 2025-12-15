import { expect, test } from '@playwright/test';

function parseStarCount(text: string) {
  const match = text.match(/★\s*([0-9][0-9,]*)/);
  if (!match) return 0;
  return Number.parseInt(match[1].replaceAll(",", ""), 10);
}

test.describe('projects explorer', () => {
  test('filters by language and sorts by stars', async ({ page }) => {
    await page.goto('/projects');

    const grid = page.getByTestId('projects-explorer');
    await expect(grid).toBeVisible();

    const projectCards = page.getByTestId('projects-recent-project');
    await expect(projectCards.first()).toBeVisible();

    const initialCount = await projectCards.count();
    expect(initialCount).toBeGreaterThan(0);

    const languageChips = page.getByTestId('projects-filter-language');
    const languageChipCount = await languageChips.count();
    test.skip(languageChipCount === 0, 'No language chips available to test');

    const firstChip = languageChips.first();
    const language = (await firstChip.innerText()).trim();
    await firstChip.click();

    await expect(projectCards.first()).toContainText(new RegExp(language, 'i'));
    const filteredCount = await projectCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.getByTestId('projects-filter-all').click();
    await expect(projectCards.first()).toBeVisible();
    expect(await projectCards.count()).toBe(initialCount);

    await page.getByTestId('projects-sort').click();
    await page.getByRole('option', { name: 'Most starred' }).click();
    await expect(page.getByTestId('projects-sort')).toContainText(/most starred/i);

    // Grab the first handful of cards and ensure star counts are descending.
    const texts = await projectCards.evaluateAll((nodes) =>
      nodes.slice(0, 6).map((node) => (node as HTMLElement).innerText ?? ''),
    );

    const stars = texts.map(parseStarCount);
    for (let i = 1; i < stars.length; i += 1) {
      expect(stars[i]).toBeLessThanOrEqual(stars[i - 1]);
    }
  });
});
