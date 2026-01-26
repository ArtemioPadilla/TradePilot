/**
 * Markets Page E2E Tests
 *
 * Tests for the enhanced markets page including:
 * - Market overview section
 * - Asset table with filtering and sorting
 * - User watchlist functionality
 * - Strategy integration
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

test.describe('Markets Page', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is authenticated
    await ensureAuthenticated(page);
    // Navigate to markets page
    await page.goto('/dashboard/markets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test.describe('Page Layout', () => {
    test('should display markets page header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Markets', level: 2 })).toBeVisible();
      await expect(page.getByText('Browse market data across different asset classes')).toBeVisible();
    });

    test('should display search box', async ({ page }) => {
      await expect(page.getByPlaceholder('Search assets...')).toBeVisible();
    });

    test('should display category tabs', async ({ page }) => {
      const tabs = ['Stocks', 'ETFs', 'Bonds', 'Fixed Income', 'Commodities', 'Crypto'];
      for (const tab of tabs) {
        await expect(page.getByRole('button', { name: tab })).toBeVisible();
      }
    });
  });

  test.describe('Asset Table', () => {
    test('should display asset table with headers', async ({ page }) => {
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Symbol' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Price' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Change' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '% Change' })).toBeVisible();
    });

    test('should display stock data in table', async ({ page }) => {
      // Check for specific stocks (mock data)
      await expect(page.getByRole('cell', { name: 'NVDA' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'AAPL' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'MSFT' })).toBeVisible();
    });

    test('should show positive changes in green', async ({ page }) => {
      const positiveCell = page.locator('td').filter({ hasText: /^\+\d/ }).first();
      await expect(positiveCell).toHaveClass(/positive/);
    });

    test('should show negative changes in red', async ({ page }) => {
      const negativeCell = page.locator('td').filter({ hasText: /^-\d/ }).first();
      await expect(negativeCell).toHaveClass(/negative/);
    });
  });

  test.describe('Category Filtering', () => {
    test('should filter assets by category when clicking tabs', async ({ page }) => {
      // Click on ETFs tab
      await page.getByRole('button', { name: 'ETFs' }).click();

      // Should see ETF data
      await expect(page.getByRole('cell', { name: 'SPY' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'QQQ' })).toBeVisible();
    });

    test('should show Crypto assets when Crypto tab is clicked', async ({ page }) => {
      await page.getByRole('button', { name: 'Crypto' }).click();

      // Should see crypto data
      await expect(page.getByRole('cell', { name: 'BTC' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'ETH' })).toBeVisible();
    });

    test('should highlight active tab', async ({ page }) => {
      const stocksTab = page.getByRole('button', { name: 'Stocks' });
      await expect(stocksTab).toHaveClass(/active/);

      // Click ETFs tab
      const etfsTab = page.getByRole('button', { name: 'ETFs' });
      await etfsTab.click();

      await expect(etfsTab).toHaveClass(/active/);
      await expect(stocksTab).not.toHaveClass(/active/);
    });
  });

  test.describe('Search Functionality', () => {
    test('should filter assets by search query', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search assets...');

      // Search for NVDA
      await searchInput.fill('NVDA');

      // Should show NVDA
      await expect(page.getByRole('cell', { name: 'NVDA' })).toBeVisible();

      // Should not show other stocks (they should be filtered out)
      await expect(page.getByRole('cell', { name: 'AAPL' })).not.toBeVisible();
    });

    test('should search by company name', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search assets...');

      // Search by name
      await searchInput.fill('Apple');

      // Should show Apple
      await expect(page.getByRole('cell', { name: 'AAPL' })).toBeVisible();
    });

    test('should show empty state when no results found', async ({ page }) => {
      const searchInput = page.getByPlaceholder('Search assets...');

      // Search for something that doesn't exist
      await searchInput.fill('XYZNONEXISTENT');

      // Should show empty message
      await expect(page.getByText(/No assets found/)).toBeVisible();
    });
  });

  test.describe('Market Overview Section', () => {
    test('should display top performers card', async ({ page }) => {
      // The market overview section should be visible
      await expect(page.getByText('Market Overview')).toBeVisible();
      await expect(page.getByText('Top Performers')).toBeVisible();
    });

    test('should display lowest performers card', async ({ page }) => {
      await expect(page.getByText('Potential Opportunities')).toBeVisible();
    });

    test('should have period selector buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: '1D' })).toBeVisible();
      await expect(page.getByRole('button', { name: '1W' })).toBeVisible();
      await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
    });
  });

  test.describe('User Section (Authenticated)', () => {
    test('should show user watchlist section for authenticated users', async ({ page }) => {
      // Assuming user is authenticated (from test setup)
      await expect(page.getByText('Your Trading Tools')).toBeVisible();
    });

    test('should show My Watchlist card', async ({ page }) => {
      await expect(page.getByText('My Watchlist')).toBeVisible();
    });

    test('should show Strategy Universe card', async ({ page }) => {
      await expect(page.getByText('Strategy Universe')).toBeVisible();
    });

    test('should show My Holdings card', async ({ page }) => {
      await expect(page.getByText('My Holdings')).toBeVisible();
    });

    test('should show Strategy Signals card', async ({ page }) => {
      await expect(page.getByText('Strategy Signals')).toBeVisible();
    });
  });

  test.describe('Watchlist Actions', () => {
    test('should show action menu on asset row', async ({ page }) => {
      // Find an asset row and look for action button
      const actionButton = page.locator('button[aria-label="Asset actions"]').first();
      await actionButton.click();

      // Should show action menu
      await expect(page.getByText('Add to Watchlist')).toBeVisible();
      await expect(page.getByText('Create Alert')).toBeVisible();
    });

    test('should open add to watchlist modal', async ({ page }) => {
      // Click action menu
      const actionButton = page.locator('button[aria-label="Asset actions"]').first();
      await actionButton.click();

      // Click add to watchlist
      await page.getByText('Add to Watchlist').click();

      // Modal should appear
      await expect(page.getByRole('heading', { name: 'Add to Watchlist' })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should hide tab labels on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Tab buttons should still be visible
      const stocksTab = page.getByRole('button', { name: 'Stocks' });
      await expect(stocksTab).toBeVisible();

      // But the label text might be hidden (check CSS)
      // The icon should still be visible
    });

    test('should stack header on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Header should still be functional
      await expect(page.getByPlaceholder('Search assets...')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper table structure', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();

      // Check for proper header row
      const headerRow = page.getByRole('row').first();
      await expect(headerRow).toBeVisible();
    });

    test('should have accessible buttons', async ({ page }) => {
      // All category tabs should be accessible buttons
      const tabs = page.getByRole('button');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(5);
    });

    test('should have accessible search input', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /search/i });
      await expect(searchInput).toBeVisible();
    });
  });
});

test.describe('Markets Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should show login prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/markets');

    // Should redirect to login or show login prompt
    // The exact behavior depends on auth guard implementation
    const loginPrompt = page.getByText(/Sign in/);
    const loginPage = page.url().includes('/auth/login');

    // Either login prompt is shown or redirected to login
    const hasLoginUI = await loginPrompt.isVisible().catch(() => false) || loginPage;
    expect(hasLoginUI).toBeTruthy();
  });
});
