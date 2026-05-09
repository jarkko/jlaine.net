const { expect, test } = require('@playwright/test');

function pageErrors(page) {
  const failures = [];
  page.on('pageerror', err => failures.push(`pageerror: ${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') failures.push(`console.error: ${msg.text()}`); });
  return failures;
}

test.describe('indoor beach map', () => {
  test('boots, renders indoor pins, and opens the venue directory', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/indoor-beach/');

    await expect(page.locator('#map.leaflet-container')).toBeVisible();
    await expect(page.locator('#hint')).not.toContainText('Failed to load venue data');

    await page.waitForFunction(() => (
      document.querySelectorAll('.bv-marker, .bv-cluster').length > 0
    ));
    expect(await page.locator('.bv-marker, .bv-cluster').count()).toBeGreaterThan(0);

    // Indoor mode is default
    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-mode="outdoor"]')).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);
    await expect(page.locator('#venues .card').first()).toBeVisible();

    await page.locator('#search').fill('Øksilhallen');
    await expect(page.locator('#venues .card')).toHaveCount(1);
    await expect(page.locator('#venues .card')).toContainText('Øksilhallen');
    await expect(page.locator('#venues .card')).toContainText('Støveien 24');

    await page.locator('#search').fill('Gimle');
    await expect(page.locator('#venues .card')).toHaveCount(1);
    await expect(page.locator('#venues .card')).toContainText('Sandhallen på Gimle');
    await expect(page.locator('#venues .card')).toContainText('Jegersbergveien 3');

    expect(failures).toEqual([]);
  });

  test('switches to outdoor mode and shows Finland sand courts', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/indoor-beach/');

    // Wait for indoor data to boot first
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // Switch to outdoor mode
    await page.locator('[data-mode="outdoor"]').click();
    await expect(page.locator('[data-mode="outdoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'false');

    // Mode notice should be visible and mention Finland/LIPAS
    await expect(page.locator('#mode-notice')).toBeVisible();
    await expect(page.locator('#mode-notice')).toContainText('Finland');

    // Outdoor markers should appear
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);
    expect(await page.locator('.bv-out-marker, .bv-out-cluster').count()).toBeGreaterThan(0);

    // Open sidebar and verify outdoor cards are shown
    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);

    // Hint should reference outdoor courts, not indoor halls
    await expect(page.locator('#hint')).toContainText('outdoor');

    // Search for a known Finnish outdoor court by city
    await page.locator('#search').fill('Helsinki');
    const cards = page.locator('#venues .card');
    await expect(cards.first()).toBeVisible();
    // Cards should have tag--out class (outdoor badges)
    await expect(page.locator('#venues .tag--out').first()).toBeVisible();

    expect(failures).toEqual([]);
  });
});
