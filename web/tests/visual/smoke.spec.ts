/**
 * Console-error smoke — blocks PRs on hydration mismatches, broken scripts,
 * and failed module loads. No baselines required; runs fast.
 *
 * Uses the console-guard fixture which automatically fails a test if any
 * browser console.error or uncaught pageerror is emitted during the page
 * load. See tests/fixtures/console-guard.ts for the allowlist.
 *
 * Route coverage: representative cross-section of the app — home, gallery
 * index, dashboard demo, docs, and one i18n route.
 */

import { test, expect } from '../fixtures/console-guard';

const ROUTES = [
  '/',
  '/gallery/',
  '/demos/dashboard/',
  '/docs/',
  '/es/',
  '/auth/',
  '/app/strategies/',
  '/app/backtest/',
  '/app/lab/',
] as const;

for (const route of ROUTES) {
  test(`smoke — ${route} — no console errors`, async ({ page }) => {
    // The dashboard demo fetches api.github.com live; CI runners share an
    // unauthenticated rate limit and intermittently get 403s, which the
    // console guard (rightly) flags. Stub the API so smoke is deterministic —
    // same approach as dashboard.spec.ts (#175).
    await page.route('https://api.github.com/**', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    // Assert the HydrationCanary sessionStorage key is empty, tying the
    // runtime canary and the CI gate to the same signal.
    const canaryKey = await page.evaluate(() =>
      sessionStorage.getItem('hydration-mismatch-urls'),
    );
    expect(
      canaryKey === null || canaryKey === '[]',
      `HydrationCanary detected mismatches on ${route}: ${canaryKey}`,
    ).toBe(true);
  });
}
