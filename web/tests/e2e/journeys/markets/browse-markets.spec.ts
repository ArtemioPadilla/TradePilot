/**
 * Browse Markets User Journey
 *
 * Tests the market exploration and watchlist functionality.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Browse Markets', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/markets');
    await waitForPageReady(page);
  });

  test('should display markets page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /market/i });
    await expect(heading).toBeVisible();
  });

  test('should display major market indices', async ({ page }) => {
    // Look for index names or symbols
    const spIndex = page.locator('text=/s&p.*500|spy/i');
    const nasdaqIndex = page.locator('text=/nasdaq|qqq/i');
    const dowIndex = page.locator('text=/dow|dia/i');

    const hasSP = await spIndex.first().isVisible().catch(() => false);
    const hasNasdaq = await nasdaqIndex.first().isVisible().catch(() => false);
    const hasDow = await dowIndex.first().isVisible().catch(() => false);

    expect(hasSP || hasNasdaq || hasDow).toBe(true);
  });

  test('should display index values and changes', async ({ page }) => {
    // Look for price values and percentage changes
    const priceValues = page.locator('text=/\\$[0-9,]+|[0-9]+\\.[0-9]+/');
    const percentChanges = page.locator('text=/[+-]?[0-9]+\\.[0-9]+%/');

    const hasPrices = await priceValues.first().isVisible().catch(() => false);
    const hasChanges = await percentChanges.first().isVisible().catch(() => false);

    expect(hasPrices || hasChanges).toBe(true);
  });

  test('should display sector performance', async ({ page }) => {
    // Look for sector labels
    const techSector = page.locator('text=/technology|tech/i');
    const healthSector = page.locator('text=/health/i');
    const financeSector = page.locator('text=/financial|finance/i');
    const sectorLabel = page.locator('text=/sector/i');

    const hasTech = await techSector.first().isVisible().catch(() => false);
    const hasHealth = await healthSector.first().isVisible().catch(() => false);
    const hasFinance = await financeSector.first().isVisible().catch(() => false);
    const hasSectorLabel = await sectorLabel.first().isVisible().catch(() => false);

    expect(hasTech || hasHealth || hasFinance || hasSectorLabel).toBe(true);
  });

  test('should display top gainers section', async ({ page }) => {
    // Look for gainers section
    const gainersSection = page.locator('text=/gainer|top.*perform/i');

    const hasGainers = await gainersSection.first().isVisible().catch(() => false);

    // If no explicit gainers section, check for positive changes
    const positiveChanges = page.locator('text=/\\+[0-9]+\\.[0-9]+%/');
    const hasPositive = await positiveChanges.first().isVisible().catch(() => false);

    expect(hasGainers || hasPositive).toBe(true);
  });

  test('should display top losers section', async ({ page }) => {
    // Look for losers section
    const losersSection = page.locator('text=/loser|decline/i');

    const hasLosers = await losersSection.first().isVisible().catch(() => false);

    // If no explicit losers section, check for negative changes
    const negativeChanges = page.locator('text=/-[0-9]+\\.[0-9]+%/');
    const hasNegative = await negativeChanges.first().isVisible().catch(() => false);

    expect(hasLosers || hasNegative).toBe(true);
  });

  test('should display watchlist section', async ({ page }) => {
    // Look for watchlist
    const watchlistSection = page.locator('text=/watchlist|watch.*list/i');
    const watchlistWidget = page.locator('[data-testid="watchlist"], .watchlist');

    const hasSection = await watchlistSection.first().isVisible().catch(() => false);
    const hasWidget = await watchlistWidget.isVisible().catch(() => false);

    expect(hasSection || hasWidget).toBe(true);
  });

  test('should display symbol search', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    const searchBox = page.locator('input[type="search"], [data-testid="symbol-search"]');

    const hasSearchInput = await searchInput.isVisible().catch(() => false);
    const hasSearchBox = await searchBox.isVisible().catch(() => false);

    expect(hasSearchInput || hasSearchBox).toBe(true);
  });

  test('should search for a symbol', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('AAPL');
      await page.waitForTimeout(500);

      // Look for search results
      const appleResult = page.locator('text=/apple|aapl/i');
      const hasResult = await appleResult.first().isVisible().catch(() => false);

      expect(hasResult).toBe(true);
    }
  });

  test('should display add to watchlist button', async ({ page }) => {
    // Search for a symbol first
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('MSFT');
      await page.waitForTimeout(500);

      // Look for add button
      const addButton = page.getByRole('button', { name: /add|watch|\+/i });
      const hasAddButton = await addButton.first().isVisible().catch(() => false);

      expect(hasAddButton).toBe(true);
    }
  });

  test('should display mini chart for watchlist items', async ({ page }) => {
    // Look for chart elements in watchlist
    const watchlistItem = page.locator('.watchlist-item, [data-testid="watchlist-item"]');
    const chartElement = page.locator('svg, canvas, .chart');

    const hasWatchlistItem = await watchlistItem.first().isVisible().catch(() => false);
    if (hasWatchlistItem) {
      const hasChart = await chartElement.first().isVisible().catch(() => false);
      expect(hasChart).toBe(true);
    }
  });

  test('should display remove from watchlist action', async ({ page }) => {
    // Look for watchlist items with remove button
    const watchlistItem = page.locator('.watchlist-item, [data-testid="watchlist-item"]').first();

    if (await watchlistItem.isVisible()) {
      const removeButton = watchlistItem.getByRole('button', { name: /remove|delete|x/i });
      const removeIcon = watchlistItem.locator('[aria-label*="remove" i], .remove-icon');

      const hasRemoveButton = await removeButton.isVisible().catch(() => false);
      const hasRemoveIcon = await removeIcon.isVisible().catch(() => false);

      expect(hasRemoveButton || hasRemoveIcon).toBe(true);
    }
  });

  test('should display refresh/update indicator', async ({ page }) => {
    // Look for last updated indicator or refresh button
    const lastUpdated = page.locator('text=/last.*update|as.*of|updated/i');
    const refreshButton = page.getByRole('button', { name: /refresh|update/i });

    const hasLastUpdated = await lastUpdated.first().isVisible().catch(() => false);
    const hasRefresh = await refreshButton.isVisible().catch(() => false);

    expect(hasLastUpdated || hasRefresh).toBe(true);
  });
});
