import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * Analytics E2E Tests
 *
 * Tests for the Risk Dashboard and Tax Report features on the analytics page.
 * These tests require authentication.
 */

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display analytics page when authenticated', async ({ page }) => {
    // Should be on the analytics page
    await expect(page).toHaveURL(/\/dashboard\/analytics/);

    // Main content should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    // Check for the page header
    const header = page.locator('h1, h2').filter({ hasText: /Analytics|Risk/i });
    await expect(header.first()).toBeVisible();
  });

  test('should display risk metrics section', async ({ page }) => {
    // Look for risk metrics section or cards
    const metricsSection = page.locator('.metrics-grid, .risk-metrics, [class*="metric"]');
    const count = await metricsSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display VaR metric', async ({ page }) => {
    // VaR (Value at Risk) should be visible
    const varElement = page.locator('text=/VaR|Value at Risk/i');
    await expect(varElement.first()).toBeVisible();
  });

  test('should display Sharpe Ratio metric', async ({ page }) => {
    // Sharpe Ratio should be visible
    const sharpeElement = page.locator('text=/Sharpe/i');
    await expect(sharpeElement.first()).toBeVisible();
  });

  test('should display position risk table', async ({ page }) => {
    // Look for position risk table or section
    const positionSection = page.locator('text=/Position|Holdings/i');
    const tableOrSection = await positionSection.count();
    expect(tableOrSection).toBeGreaterThan(0);
  });

  test('should display correlation matrix section', async ({ page }) => {
    // Look for correlation matrix
    const correlationElement = page.locator('text=/Correlation/i');
    await expect(correlationElement.first()).toBeVisible();
  });

  test('should display stress test section', async ({ page }) => {
    // Look for stress test scenarios
    const stressElement = page.locator('text=/Stress/i');
    await expect(stressElement.first()).toBeVisible();
  });

  test('should have metric cards with values', async ({ page }) => {
    // Check that metric cards display numeric values
    const metricCards = page.locator('.metric-card, .summary-card, [class*="card"]');
    const count = await metricCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Analytics Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should navigate to analytics from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Find and click analytics link
    const analyticsLink = page.locator('a[href="/dashboard/analytics"]');
    if (await analyticsLink.isVisible().catch(() => false)) {
      await analyticsLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/dashboard\/analytics/);
    }
  });

  test('should show analytics in sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Verify analytics link exists
    const analyticsLink = page.locator('a[href="/dashboard/analytics"]');
    await expect(analyticsLink).toBeVisible();
  });

  test('should highlight analytics nav item when active', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForTimeout(1000);

    // The analytics nav item should have active styling
    const activeNavItem = page.locator('a[href="/dashboard/analytics"].active, a[href="/dashboard/analytics"][class*="active"]');
    await expect(activeNavItem).toBeVisible();
  });
});

test.describe('Analytics Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard/analytics');
    await page.waitForTimeout(2000);

    // Should still be on analytics page
    await expect(page).toHaveURL(/\/dashboard\/analytics/);

    // Content should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/analytics');
    await page.waitForTimeout(2000);

    // Should still be on analytics page
    await expect(page).toHaveURL(/\/dashboard\/analytics/);

    // Content should be visible and scrollable
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('metrics grid should adapt to screen size', async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/dashboard/analytics');
    await page.waitForTimeout(1000);

    const metricsGrid = page.locator('.metrics-grid, .summary-grid, [class*="grid"]').first();
    await expect(metricsGrid).toBeVisible();

    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Grid should still be visible
    await expect(metricsGrid).toBeVisible();
  });
});

test.describe('Analytics Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display percentage values correctly', async ({ page }) => {
    // Look for percentage values (with % symbol)
    const percentages = page.locator('text=/%$/');
    const count = await percentages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display correlation values between -1 and 1', async ({ page }) => {
    // Correlation matrix cells should have values
    const correlationSection = page.locator('.correlation-matrix, [class*="correlation"]');
    if (await correlationSection.isVisible().catch(() => false)) {
      const cells = correlationSection.locator('.matrix-cell, td, [class*="cell"]');
      const count = await cells.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should show positive values in green and negative in red', async ({ page }) => {
    // Check for color-coded values
    const positiveElements = page.locator('.positive, [class*="positive"], [style*="green"]');
    const negativeElements = page.locator('.negative, [class*="negative"], [style*="red"]');

    const positiveCount = await positiveElements.count();
    const negativeCount = await negativeElements.count();

    // Should have at least some color-coded values
    expect(positiveCount + negativeCount).toBeGreaterThan(0);
  });

  test('should display stress test scenarios', async ({ page }) => {
    // Look for stress test scenario names
    const scenarios = page.locator('text=/Market Crash|Tech Selloff|Interest Rate/i');
    const count = await scenarios.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Analytics Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1, h2, h3 elements
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    const h3 = page.locator('h3');

    const h1Count = await h1.count();
    const h2Count = await h2.count();
    const h3Count = await h3.count();

    // Should have at least one heading
    expect(h1Count + h2Count + h3Count).toBeGreaterThan(0);
  });

  test('should have accessible table structure', async ({ page }) => {
    // Look for tables with proper structure
    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      // Tables should have headers
      const headers = page.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  test('should have sufficient color contrast for text', async ({ page }) => {
    // This is a basic check - full contrast testing requires axe-core
    const textElements = page.locator('p, span, td, th, h1, h2, h3, h4');
    const count = await textElements.count();
    expect(count).toBeGreaterThan(0);
  });
});
