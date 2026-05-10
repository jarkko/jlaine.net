const { expect, test } = require('@playwright/test');

function pageErrors(page) {
  const failures = [];
  page.on('pageerror', err => failures.push(`pageerror: ${err.message}`));
  page.on('console', msg => { if (msg.type() === 'error') failures.push(`console.error: ${msg.text()}`); });
  return failures;
}

test.describe('beach volleyball map', () => {
  test('boots at /beach-volleyball/, defaults to indoor, renders pins', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');

    await expect(page.locator('#map.leaflet-container')).toBeVisible();
    await expect(page.locator('#hint')).not.toContainText('Failed to load venue data');

    await page.waitForFunction(() => (
      document.querySelectorAll('.bv-marker, .bv-cluster').length > 0
    ));
    expect(await page.locator('.bv-marker, .bv-cluster').count()).toBeGreaterThan(0);

    // Indoor mode is default; URL hash reflects it
    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-mode="outdoor"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/\/beach-volleyball\/#indoor$/);

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

  test('hash #outdoor boots directly into outdoor mode', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#outdoor');

    await expect(page.locator('#map.leaflet-container')).toBeVisible();

    // Should boot directly in outdoor mode
    await expect(page.locator('[data-mode="outdoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'false');

    // Outdoor markers appear without needing to click
    await page.waitForFunction(() => (
      document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0
    ));
    expect(await page.locator('.bv-out-marker, .bv-out-cluster').count()).toBeGreaterThan(0);

    expect(failures).toEqual([]);
  });

  test('switching modes updates URL hash and supports back/forward', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    await expect(page).toHaveURL(/\#indoor$/);

    await page.locator('[data-mode="outdoor"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);
    await expect(page).toHaveURL(/\#outdoor$/);

    // Browser back should return to indoor
    await page.goBack();
    await expect(page).toHaveURL(/\#indoor$/);
    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'true');

    expect(failures).toEqual([]);
  });

  test('/indoor-beach/ redirects to /beach-volleyball/', async ({ page }) => {
    await page.goto('/indoor-beach/');
    await expect(page).toHaveURL(/\/beach-volleyball\//);
  });

  test('hash restores country and search query on load', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#mode=indoor&country=NO&q=Gimle');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    await expect(page.locator('[data-mode="indoor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.chip[data-country="NO"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#search')).toHaveValue('Gimle');

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#venues .card')).toHaveCount(1);
    await expect(page.locator('#venues .card')).toContainText('Sandhallen på Gimle');

    expect(failures).toEqual([]);
  });

  test('sidebar is a proper modal dialog with inert siblings', async ({ page }) => {
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('role', 'dialog');
    await expect(sidebar).toHaveAttribute('aria-modal', 'true');
    await expect(sidebar).toHaveAttribute('aria-labelledby', 'sidebar-title');

    // Closed: siblings are interactive
    await expect(page.locator('.topbar')).not.toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).not.toHaveAttribute('inert', '');

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(sidebar).toHaveClass(/is-open/);

    // Open: siblings are inert
    await expect(page.locator('.topbar')).toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).toHaveAttribute('inert', '');

    // Escape closes and clears inert
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveClass(/is-open/);
    await expect(page.locator('.topbar')).not.toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).not.toHaveAttribute('inert', '');
  });

  test('switches to outdoor mode and shows Finland sand courts', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    await page.locator('[data-mode="outdoor"]').click();
    await expect(page.locator('[data-mode="outdoor"]')).toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('#mode-notice')).toBeVisible();
    await expect(page.locator('#mode-notice')).toContainText('Finland');

    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);
    expect(await page.locator('.bv-out-marker, .bv-out-cluster').count()).toBeGreaterThan(0);

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);
    await expect(page.locator('#hint')).toContainText('outdoor');

    await page.locator('#search').fill('Helsinki');
    await expect(page.locator('#venues .card').first()).toBeVisible();
    await expect(page.locator('#venues .tag--out').first()).toBeVisible();

    expect(failures).toEqual([]);
  });
});
