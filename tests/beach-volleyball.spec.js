const { expect, test } = require('@playwright/test');

function pageErrors(page) {
  const failures = [];
  page.on('pageerror', (err) => failures.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') failures.push(`console.error: ${msg.text()}`);
  });
  return failures;
}

test.describe('beach volleyball map', () => {
  test('boots at /beach-volleyball/, defaults to indoor, renders pins', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');

    await expect(page.locator('#map.leaflet-container')).toBeVisible();
    await expect(page.locator('#hint')).not.toContainText('Failed to load venue data');

    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);
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
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);
    expect(await page.locator('.bv-out-marker, .bv-out-cluster').count()).toBeGreaterThan(0);

    expect(failures).toEqual([]);
  });

  test('both mode renders indoor halls and outdoor courts together', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#both');

    await expect(page.locator('[data-mode="both"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#mode-notice')).toContainText('Outdoor courts: Finland only');
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.bv-marker, .bv-cluster').length > 0 &&
        document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0,
    );

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#venues .card').first()).toBeVisible();
    await expect(page.locator('#venues .card--outdoor').first()).toBeVisible();
    await expect(page.locator('#hint')).toContainText('venues');

    expect(failures).toEqual([]);
  });

  test('switching modes updates URL hash and supports back/forward', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    await expect(page).toHaveURL(/#indoor$/);

    await page.locator('[data-mode="outdoor"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);
    await expect(page).toHaveURL(/#outdoor$/);

    // Browser back should return to indoor
    await page.goBack();
    await expect(page).toHaveURL(/#indoor$/);
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
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await expect(sidebar).toHaveAttribute('inert', '');

    // Closed: siblings are interactive
    await expect(page.locator('.topbar')).not.toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).not.toHaveAttribute('inert', '');

    await page.getByRole('button', { name: /venues/i }).click();
    await expect(sidebar).toHaveClass(/is-open/);
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    await expect(sidebar).not.toHaveAttribute('inert', '');

    // Open: siblings are inert
    await expect(page.locator('.topbar')).toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).toHaveAttribute('inert', '');

    // Escape closes and clears inert
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveClass(/is-open/);
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await expect(sidebar).toHaveAttribute('inert', '');
    await expect(page.locator('.topbar')).not.toHaveAttribute('inert', '');
    await expect(page.locator('.map-wrap')).not.toHaveAttribute('inert', '');
  });

  test('venue permalink boots with the popup open', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#mode=indoor&id=fi-biitsi-pasila');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // Popup is open with the matching venue
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Biitsi Pasila');
    // URL is preserved verbatim
    await expect(page).toHaveURL(/#mode=indoor&id=fi-biitsi-pasila$/);
    expect(failures).toEqual([]);
  });

  test('clicking a card writes id= to the URL; closing the popup removes it', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    await page.getByRole('button', { name: /venues/i }).click();
    await page.locator('#search').fill('Biitsi Pasila');
    await expect(page.locator('#venues .card')).toHaveCount(1);

    await page.locator('#venues .card').first().click();
    await expect(page).toHaveURL(/[?&#]id=fi-biitsi-pasila/);
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Biitsi Pasila');

    // Close the sidebar so its backdrop doesn't intercept the popup-close click.
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).not.toHaveClass(/is-open/);

    // Close the popup → id should disappear from the URL
    await page.locator('.leaflet-popup-close-button').click();
    await expect(page).not.toHaveURL(/[?&#]id=/);
    expect(failures).toEqual([]);
  });

  test('switching directly from venue A to venue B ends with only B selected', async ({ page }) => {
    const failures = pageErrors(page);
    // Boot with A's permalink already open — the popup is up before we trigger
    // the switch, which is exactly the popupclose-A → popupopen-B race the
    // popupclose handler needs to handle correctly.
    await page.goto('/beach-volleyball/#mode=indoor&id=fi-biitsi-pasila');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Biitsi Pasila');

    await page.evaluate(() => {
      location.hash = '#mode=indoor&id=no-sandhallen-pa-gimle-ksk';
    });

    // Wait for the previous popup to actually close before asserting on the
    // remaining one — markercluster's pan/zoom can keep the old popup briefly
    // visible while the new one materialises.
    await expect(page.locator('.leaflet-popup-content')).toHaveCount(1, { timeout: 5000 });
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Sandhallen');
    await expect(page).toHaveURL(/[?&#]id=no-sandhallen-pa-gimle-ksk/);
    await expect(page).not.toHaveURL(/[?&#]id=fi-biitsi-pasila/);
    expect(failures).toEqual([]);
  });

  test('outdoor venue permalink boots with the popup open', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#mode=outdoor&id=fi-out-529117');
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);

    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Hääkiven');
    await expect(page).toHaveURL(/#mode=outdoor&id=fi-out-529117$/);
    expect(failures).toEqual([]);
  });

  test('back-navigating from a venue permalink re-fits to the new mode', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#indoor');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // Go to an outdoor venue permalink — the map should fly to Hääkiven.
    await page.evaluate(() => {
      location.hash = '#mode=outdoor&id=fi-out-529117';
    });
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Hääkiven', { timeout: 10000 });

    // Press Back — should drop the venue AND re-fit the map to indoor bounds
    // (i.e., zoom out from Hääkiven), not just close the popup in place.
    await page.goBack();
    await expect(page).toHaveURL(/#indoor$/);
    await expect(page.locator('.leaflet-popup-content')).toHaveCount(0);

    // Poll until the indoor re-fit has settled: ≥4 indoor markers visible inside
    // the map viewport proves we zoomed back out (not stayed on Hääkiven).
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const markers = document.querySelectorAll('.leaflet-marker-icon.bv-marker');
            const mapEl = document.getElementById('map');
            const r = mapEl.getBoundingClientRect();
            let visibleCount = 0;
            markers.forEach((m) => {
              const mr = m.getBoundingClientRect();
              if (mr.left >= r.left && mr.right <= r.right && mr.top >= r.top && mr.bottom <= r.bottom) visibleCount++;
            });
            return visibleCount;
          }),
        { timeout: 3000 },
      )
      .toBeGreaterThan(3);
    const visibleStandaloneMarkers = await page.evaluate(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon.bv-marker');
      const mapEl = document.getElementById('map');
      const r = mapEl.getBoundingClientRect();
      let count = 0;
      markers.forEach((m) => {
        const mr = m.getBoundingClientRect();
        if (mr.left >= r.left && mr.right <= r.right && mr.top >= r.top && mr.bottom <= r.bottom) count++;
      });
      return count;
    });
    expect(visibleStandaloneMarkers).toBeGreaterThan(3);
    expect(failures).toEqual([]);
  });

  test('hashchange that swaps mode and id loads outdoor data and opens the popup', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#indoor');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // Trigger a synthetic external link / paste from indoor → outdoor permalink.
    await page.evaluate(() => {
      location.hash = '#mode=outdoor&id=fi-out-529117';
    });

    // The handler must await the outdoor CSV before selectVenue, so the popup
    // is allowed to take some time to appear.
    await expect(page.locator('.leaflet-popup-content .popup__name')).toContainText('Hääkiven', { timeout: 10000 });
    await expect(page).toHaveURL(/#mode=outdoor&id=fi-out-529117$/);
    expect(failures).toEqual([]);
  });

  test('stale venue id in URL is silently ignored', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#mode=indoor&id=this-venue-does-not-exist');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // No popup, and the id is gone from the URL
    await expect(page.locator('.leaflet-popup-content')).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&#]id=/);
    expect(failures).toEqual([]);
  });

  test('skip link is keyboard-reachable and opens the venue directory', async ({ page }) => {
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    // First Tab from <body> should land on the skip link
    await page.keyboard.press('Tab');
    await expect(page.locator('#skip-link')).toBeFocused();

    // Activating it opens the dialog and focuses the search input
    await page.keyboard.press('Enter');
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);
    await expect(page.locator('#search')).toBeFocused();
  });

  test('CSV download link tracks the active mode', async ({ page }) => {
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() => document.querySelectorAll('.bv-marker, .bv-cluster').length > 0);

    const link = page.locator('#data-link');
    await expect(link).toHaveText('↓ Indoor CSV');
    await expect(link).toHaveAttribute('href', /nordic_indoor_beach_volleyball_facilities\.csv$/);

    await page.locator('[data-mode="outdoor"]').click();
    await expect(link).toHaveText('↓ Outdoor CSV');
    await expect(link).toHaveAttribute('href', /finland_outdoor_beach_volleyball_courts\.csv$/);
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

  test('clicking marker B while marker A popup is open ends with only B selected', async ({ page }) => {
    const failures = pageErrors(page);
    await page.goto('/beach-volleyball/#outdoor');

    // Wait for outdoor data to arrive (initially all in clusters at country-fit zoom).
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker, .bv-out-cluster').length > 0);

    // Zoom into Helsinki where several outdoor courts are within a few hundred metres
    // of each other, so MarkerCluster separates them into individual .bv-out-marker icons.
    await page.evaluate(() => {
      window.__bvTestHelpers.leafletMap.setView([60.1699, 24.9384], 14);
    });
    await page.waitForFunction(() => document.querySelectorAll('.bv-out-marker').length > 1);

    const markers = page.locator('.bv-out-marker');

    // Click marker A — URL should gain an id param.
    await markers.nth(0).click();
    await expect(page).toHaveURL(/[?&#]id=fi-out-/);
    const firstUrl = page.url();

    // Click marker B while A's popup is still open.
    await markers.nth(1).click();

    // Only one popup visible — the Leaflet synchronous popupclose→popupopen
    // chain must not leave a stale second popup open.
    await expect(page.locator('.leaflet-popup-content')).toHaveCount(1);

    // URL must have advanced to B's id (not reverted to A or cleared).
    await expect(page).toHaveURL(/[?&#]id=fi-out-/);
    expect(page.url()).not.toBe(firstUrl);

    expect(failures).toEqual([]);
  });
});
