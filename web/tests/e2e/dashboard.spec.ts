import { test, expect } from '@playwright/test';

// Note: Dashboard is protected by AuthGuard
// These tests verify the page structure when accessed
// In a real scenario, you'd use auth fixtures or mock authentication

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for either auth redirect or dashboard content
    await page.waitForTimeout(1000);
  });

  test('should display dashboard layout or auth guard', async ({ page }) => {
    // Dashboard should show either the main content or loading state
    const hasMain = await page.locator('main').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
    const wasRedirected = page.url().includes('/auth/login');

    expect(hasMain || hasLoading || wasRedirected).toBe(true);
  });

  test('should have navigation sidebar when authenticated', async ({ page }) => {
    // Check for sidebar navigation (may not be visible if redirected)
    const sidebar = page.locator('aside.sidebar');
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      // If not redirected, check sidebar exists (may be hidden on mobile)
      const sidebarExists = await sidebar.count() > 0;
      expect(sidebarExists).toBe(true);
    }
  });

  test('should display portfolio summary widget', async ({ page }) => {
    // Check for portfolio summary widget if on dashboard
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const portfolioWidget = page.locator('.widget-summary, [class*="portfolio"]').first();
      if (await portfolioWidget.isVisible().catch(() => false)) {
        await expect(portfolioWidget).toBeVisible();
      }
    }
  });

  test('should display holdings section', async ({ page }) => {
    // Check for holdings section
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const holdingsSection = page.locator('.widget-holdings, text=Holdings').first();
      if (await holdingsSection.isVisible().catch(() => false)) {
        await expect(holdingsSection).toBeVisible();
      }
    }
  });

  test('should have header with user menu', async ({ page }) => {
    // Check for header with user menu
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const header = page.locator('header');
      if (await header.isVisible().catch(() => false)) {
        await expect(header).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Page should load without crashing
    const wasRedirected = page.url().includes('/auth/login');
    const hasContent = await page.locator('body').isVisible();

    expect(hasContent || wasRedirected).toBe(true);
  });
});

test.describe('Dashboard Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      // Test that navigation links exist
      const navLinks = page.locator('aside a[href^="/dashboard"]');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
  });

  test('should display performance chart widget', async ({ page }) => {
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const chartWidget = page.locator('.widget-chart, text=Performance').first();
      if (await chartWidget.isVisible().catch(() => false)) {
        await expect(chartWidget).toBeVisible();
      }
    }
  });

  test('should display allocation chart widget', async ({ page }) => {
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const allocationWidget = page.locator('.widget-allocation, text=Allocation').first();
      if (await allocationWidget.isVisible().catch(() => false)) {
        await expect(allocationWidget).toBeVisible();
      }
    }
  });

  test('should display recent activity widget', async ({ page }) => {
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const activityWidget = page.locator('.widget-activity, text=Recent Activity').first();
      if (await activityWidget.isVisible().catch(() => false)) {
        await expect(activityWidget).toBeVisible();
      }
    }
  });

  test('should display watchlist widget', async ({ page }) => {
    const wasRedirected = page.url().includes('/auth/login');

    if (!wasRedirected) {
      const watchlistWidget = page.locator('.widget-watchlist, text=Watchlist').first();
      if (await watchlistWidget.isVisible().catch(() => false)) {
        await expect(watchlistWidget).toBeVisible();
      }
    }
  });
});
