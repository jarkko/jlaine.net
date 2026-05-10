const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Run axe-core against the page in a couple of meaningful states. We only fail
// on serious + critical findings: minor / moderate are noisy in third-party
// CSS we don't control (Leaflet popups etc.) and would block CI for cosmetic
// reasons. The full report is logged so it stays visible if someone wants it.

const SEVERITIES = ['serious', 'critical'];

function summarize(violations) {
  return violations
    .filter(v => SEVERITIES.includes(v.impact))
    .map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      target: v.nodes[0]?.target,
    }));
}

test.describe('beach volleyball map a11y (axe-core)', () => {
  test('no serious or critical violations in default (indoor) view', async ({ page }) => {
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() =>
      document.querySelectorAll('.bv-marker, .bv-cluster').length > 0
    );

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blockers = summarize(results.violations);
    expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
  });

  test('no serious or critical violations with sidebar dialog open', async ({ page }) => {
    await page.goto('/beach-volleyball/');
    await page.waitForFunction(() =>
      document.querySelectorAll('.bv-marker, .bv-cluster').length > 0
    );
    await page.getByRole('button', { name: /venues/i }).click();
    await expect(page.locator('#sidebar')).toHaveClass(/is-open/);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blockers = summarize(results.violations);
    expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
  });
});
