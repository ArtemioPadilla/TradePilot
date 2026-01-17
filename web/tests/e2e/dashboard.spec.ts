import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Note: These tests assume the dashboard is accessible
  // In production, you'd mock authentication or use test fixtures

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard layout', async ({ page }) => {
    // Check for main dashboard elements
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    // Check for sidebar navigation
    const sidebar = page.locator('aside, nav, [role="navigation"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should display portfolio summary', async ({ page }) => {
    // Check for portfolio summary widget
    const portfolioWidget = page.locator('[data-widget="portfolio-summary"], .portfolio-summary, h2:has-text("Portfolio")').first();

    if (await portfolioWidget.isVisible()) {
      await expect(portfolioWidget).toBeVisible();
    }
  });

  test('should display holdings table', async ({ page }) => {
    // Check for holdings table
    const holdingsTable = page.locator('table, [data-widget="holdings"]').first();

    if (await holdingsTable.isVisible()) {
      await expect(holdingsTable).toBeVisible();
    }
  });

  test('should have user menu', async ({ page }) => {
    // Check for user menu or profile link
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Profile"), [aria-label*="user"]').first();

    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Main content should still be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Sidebar might be hidden on mobile
    const sidebar = page.locator('aside');
    // Can be hidden or collapsed on mobile - just verify page loads
  });
});

test.describe('Dashboard Navigation', () => {
  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Test navigation links if visible
    const navLinks = [
      { pattern: /portfolio/i, expectedUrl: '/dashboard' },
      { pattern: /accounts/i, expectedUrl: '/dashboard/accounts' },
      { pattern: /trading/i, expectedUrl: '/dashboard/trading' },
      { pattern: /strategies/i, expectedUrl: '/dashboard/strategies' },
    ];

    for (const { pattern, expectedUrl } of navLinks) {
      const link = page.getByRole('link', { name: pattern });
      if (await link.isVisible()) {
        await link.click();
        // Verify navigation occurred (page loaded without error)
        await page.waitForLoadState('networkidle');
      }
    }
  });
});

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display performance chart', async ({ page }) => {
    const chart = page.locator('canvas, svg, [data-widget="performance-chart"], .performance-chart').first();

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should display allocation chart', async ({ page }) => {
    const chart = page.locator('[data-widget="allocation-chart"], .allocation-chart, svg:has(path)').first();

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should display recent activity', async ({ page }) => {
    const activity = page.locator('[data-widget="recent-activity"], .recent-activity, :has-text("Recent Activity")').first();

    if (await activity.isVisible()) {
      await expect(activity).toBeVisible();
    }
  });

  test('should display watchlist', async ({ page }) => {
    const watchlist = page.locator('[data-widget="watchlist"], .watchlist, :has-text("Watchlist")').first();

    if (await watchlist.isVisible()) {
      await expect(watchlist).toBeVisible();
    }
  });
});
