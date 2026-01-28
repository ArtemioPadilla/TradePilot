/**
 * Portfolio Overview User Journey
 *
 * Tests the dashboard portfolio overview functionality.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Portfolio Overview', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('should display dashboard heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /dashboard|portfolio|overview/i });
    await expect(heading).toBeVisible();
  });

  test('should display total portfolio value', async ({ page }) => {
    // Look for total value metric
    const totalValue = page.locator('text=/total.*value|portfolio.*value|net.*worth/i');
    const valueAmount = page.locator('text=/\\$[0-9,]+/');

    const hasTotalValue = await totalValue.first().isVisible().catch(() => false);
    const hasAmount = await valueAmount.first().isVisible().catch(() => false);

    expect(hasTotalValue || hasAmount).toBe(true);
  });

  test('should display profit/loss indicator', async ({ page }) => {
    // Look for P&L display
    const plIndicator = page.locator('text=/p&l|profit|loss|gain|return/i');
    const percentChange = page.locator('text=/[+-]?[0-9]+\\.[0-9]+%/');

    const hasPL = await plIndicator.first().isVisible().catch(() => false);
    const hasPercent = await percentChange.first().isVisible().catch(() => false);

    expect(hasPL || hasPercent).toBe(true);
  });

  test('should display daily change', async ({ page }) => {
    // Look for daily change
    const dailyChange = page.locator('text=/today|daily|24h/i');

    const hasDailyChange = await dailyChange.first().isVisible().catch(() => false);

    expect(hasDailyChange).toBe(true);
  });

  test('should display performance chart', async ({ page }) => {
    // Look for chart component
    const chart = page.locator('canvas, svg.chart, [data-testid="chart"], .chart');
    const performanceChart = page.locator('.performance-chart, [data-testid="performance-chart"]');

    const hasChart = await chart.first().isVisible().catch(() => false);
    const hasPerformanceChart = await performanceChart.isVisible().catch(() => false);

    expect(hasChart || hasPerformanceChart).toBe(true);
  });

  test('should display chart period selectors', async ({ page }) => {
    // Look for period buttons (1W, 1M, 3M, 1Y, ALL)
    const weekButton = page.getByRole('button', { name: /1w|1.*week/i });
    const monthButton = page.getByRole('button', { name: /1m|1.*month/i });
    const yearButton = page.getByRole('button', { name: /1y|1.*year/i });
    const allButton = page.getByRole('button', { name: /all|max/i });

    const hasWeek = await weekButton.isVisible().catch(() => false);
    const hasMonth = await monthButton.isVisible().catch(() => false);
    const hasYear = await yearButton.isVisible().catch(() => false);
    const hasAll = await allButton.isVisible().catch(() => false);

    expect(hasWeek || hasMonth || hasYear || hasAll).toBe(true);
  });

  test('should change chart period on button click', async ({ page }) => {
    // Click a period button
    const monthButton = page.getByRole('button', { name: /1m|1.*month/i });

    if (await monthButton.isVisible()) {
      await monthButton.click();
      await page.waitForTimeout(500);

      // Button should be selected
      const isSelected = await monthButton.evaluate((btn) => {
        return btn.classList.contains('selected') ||
               btn.classList.contains('active') ||
               btn.getAttribute('aria-pressed') === 'true';
      });

      expect(isSelected).toBe(true);
    }
  });

  test('should display asset allocation chart', async ({ page }) => {
    // Look for allocation/pie chart
    const allocationChart = page.locator('.allocation-chart, [data-testid="allocation"]');
    const pieChart = page.locator('text=/allocation|distribution/i');

    const hasAllocationChart = await allocationChart.isVisible().catch(() => false);
    const hasPieChart = await pieChart.first().isVisible().catch(() => false);

    expect(hasAllocationChart || hasPieChart).toBe(true);
  });

  test('should display holdings table', async ({ page }) => {
    // Look for holdings table
    const holdingsTable = page.locator('table');
    const holdingsSection = page.locator('text=/holding|position/i');
    const symbolColumn = page.locator('text=/symbol|ticker/i');

    const hasTable = await holdingsTable.isVisible().catch(() => false);
    const hasSection = await holdingsSection.first().isVisible().catch(() => false);
    const hasSymbol = await symbolColumn.first().isVisible().catch(() => false);

    expect(hasTable || hasSection || hasSymbol).toBe(true);
  });

  test('should display recent activity', async ({ page }) => {
    // Look for activity section
    const activitySection = page.locator('text=/recent.*activity|activity|transaction/i');
    const activityList = page.locator('.activity-list, [data-testid="activity"]');

    const hasSection = await activitySection.first().isVisible().catch(() => false);
    const hasList = await activityList.isVisible().catch(() => false);

    expect(hasSection || hasList).toBe(true);
  });

  test('should display watchlist widget', async ({ page }) => {
    // Look for watchlist
    const watchlistWidget = page.locator('text=/watchlist/i');
    const watchlistSection = page.locator('.watchlist, [data-testid="watchlist"]');

    const hasWidget = await watchlistWidget.first().isVisible().catch(() => false);
    const hasSection = await watchlistSection.isVisible().catch(() => false);

    expect(hasWidget || hasSection).toBe(true);
  });

  test('should display performance metrics', async ({ page }) => {
    // Look for metrics like Sharpe, returns, etc.
    const sharpeRatio = page.locator('text=/sharpe/i');
    const returns = page.locator('text=/return|cagr/i');
    const drawdown = page.locator('text=/drawdown/i');
    const volatility = page.locator('text=/volatility/i');

    const hasSharpe = await sharpeRatio.first().isVisible().catch(() => false);
    const hasReturns = await returns.first().isVisible().catch(() => false);
    const hasDrawdown = await drawdown.first().isVisible().catch(() => false);
    const hasVolatility = await volatility.first().isVisible().catch(() => false);

    expect(hasSharpe || hasReturns || hasDrawdown || hasVolatility).toBe(true);
  });

  test('should have navigation to accounts', async ({ page }) => {
    // Look for accounts link
    const accountsLink = page.locator('a[href*="account"]');
    const viewAllLink = page.locator('text=/view.*all|see.*all/i');

    const hasAccountsLink = await accountsLink.first().isVisible().catch(() => false);
    const hasViewAll = await viewAllLink.first().isVisible().catch(() => false);

    expect(hasAccountsLink || hasViewAll).toBe(true);
  });

  test('should navigate to accounts page', async ({ page }) => {
    const accountsLink = page.locator('a[href*="account"]');

    if (await accountsLink.first().isVisible()) {
      await accountsLink.first().click();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url).toContain('account');
    }
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Look for sidebar
    const sidebar = page.locator('aside, nav, .sidebar');
    const dashboardLink = page.locator('a[href*="dashboard"]');

    const hasSidebar = await sidebar.first().isVisible().catch(() => false);
    const hasDashboardLink = await dashboardLink.first().isVisible().catch(() => false);

    expect(hasSidebar || hasDashboardLink).toBe(true);
  });

  test('should display user menu', async ({ page }) => {
    // Look for user menu
    const userMenu = page.locator('.user-menu, [data-testid="user-menu"]');
    const avatar = page.locator('img[alt*="avatar" i], .avatar');
    const profileButton = page.getByRole('button', { name: /profile|account|user/i });

    const hasUserMenu = await userMenu.isVisible().catch(() => false);
    const hasAvatar = await avatar.first().isVisible().catch(() => false);
    const hasProfileButton = await profileButton.isVisible().catch(() => false);

    expect(hasUserMenu || hasAvatar || hasProfileButton).toBe(true);
  });
});
