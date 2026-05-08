const { expect, test } = require('@playwright/test');

test.describe('indoor beach map', () => {
  test('boots, renders pins, and opens the venue directory', async ({ page }) => {
    const failures = [];

    page.on('pageerror', error => {
      failures.push(`pageerror: ${error.message}`);
    });

    page.on('console', message => {
      if (message.type() === 'error') {
        failures.push(`console.error: ${message.text()}`);
      }
    });

    await page.goto('/indoor-beach/');

    await expect(page.locator('#map.leaflet-container')).toBeVisible();
    await expect(page.locator('#hint')).not.toContainText('Failed to load venue data');

    await page.waitForFunction(() => (
      document.querySelectorAll('.bv-marker, .bv-cluster').length > 0
    ));

    const visiblePinCount = await page.locator('.bv-marker, .bv-cluster').count();
    expect(visiblePinCount).toBeGreaterThan(0);

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
});
