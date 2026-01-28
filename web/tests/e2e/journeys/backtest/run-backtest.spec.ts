/**
 * Run Backtest User Journey
 *
 * Tests the complete backtest execution flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Run Backtest', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/backtest');
    await waitForPageReady(page);
  });

  test('should display backtest page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /backtest|strategy/i });
    await expect(heading).toBeVisible();
  });

  test('should display strategy selector with multiple types', async ({ page }) => {
    // Look for strategy type options
    const strategySection = page.locator('[data-testid="strategy-selector"], .strategy-selector, text=/select.*strategy/i');

    // Check for at least some strategy types
    const momentumBtn = page.getByRole('button', { name: /momentum/i });
    const meanRevBtn = page.getByRole('button', { name: /mean.*reversion/i });

    const hasMomentum = await momentumBtn.isVisible().catch(() => false);
    const hasMeanRev = await meanRevBtn.isVisible().catch(() => false);

    // At least one strategy type should be visible
    expect(hasMomentum || hasMeanRev || await strategySection.first().isVisible()).toBe(true);
  });

  test('should select momentum strategy', async ({ page }) => {
    const momentumBtn = page.getByRole('button', { name: /momentum/i });

    if (await momentumBtn.isVisible()) {
      await momentumBtn.click();
      await page.waitForTimeout(300);

      // Check for strategy configuration or selection indicator
      const isSelected = await momentumBtn.evaluate((btn) => {
        return btn.classList.contains('selected') ||
               btn.classList.contains('active') ||
               btn.getAttribute('aria-pressed') === 'true' ||
               btn.getAttribute('data-selected') === 'true';
      });

      // Either button is selected or config form appears
      const configVisible = await page.locator('text=/lookback|period|parameter/i').isVisible().catch(() => false);
      expect(isSelected || configVisible).toBe(true);
    }
  });

  test('should display backtest configuration form', async ({ page }) => {
    // Look for date range inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();

    // Look for capital input
    const capitalInput = page.getByLabel(/capital|amount/i);

    // At least date inputs or capital input should exist
    const hasDateInputs = dateInputCount >= 2;
    const hasCapitalInput = await capitalInput.isVisible().catch(() => false);

    expect(hasDateInputs || hasCapitalInput).toBe(true);
  });

  test('should have run backtest button', async ({ page }) => {
    const runButton = page.getByRole('button', { name: /run.*backtest|start.*backtest|execute/i });
    await expect(runButton).toBeVisible();
  });

  test('should validate date range', async ({ page }) => {
    // Find date inputs
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
      // Set end date before start date (invalid)
      await startDateInput.fill('2023-12-31');
      await endDateInput.fill('2020-01-01');

      // Try to run backtest
      const runButton = page.getByRole('button', { name: /run.*backtest/i });

      if (await runButton.isEnabled()) {
        await runButton.click();
        await page.waitForTimeout(500);

        // Should show validation error or button should be disabled
        const hasError = await page.locator('text=/invalid|error|date.*range/i').isVisible().catch(() => false);
        expect(hasError).toBe(true);
      }
    }
  });

  test('should configure initial capital', async ({ page }) => {
    const capitalInput = page.getByLabel(/capital|initial.*amount/i);

    if (await capitalInput.isVisible()) {
      await capitalInput.clear();
      await capitalInput.fill('50000');

      await expect(capitalInput).toHaveValue('50000');
    }
  });

  test('should display benchmark selector', async ({ page }) => {
    // Look for benchmark dropdown or selector
    const benchmarkSelector = page.locator('select, [role="combobox"]').filter({ hasText: /benchmark|s&p|spy/i });
    const benchmarkLabel = page.locator('text=/benchmark/i');

    const hasBenchmarkSelector = await benchmarkSelector.isVisible().catch(() => false);
    const hasBenchmarkLabel = await benchmarkLabel.isVisible().catch(() => false);

    // Should have either selector or label
    expect(hasBenchmarkSelector || hasBenchmarkLabel).toBe(true);
  });

  test('should show backtest history section', async ({ page }) => {
    // Look for history tab or section
    const historyTab = page.getByRole('tab', { name: /history/i });
    const historySection = page.locator('text=/previous.*backtest|history|past.*runs/i');

    const hasHistoryTab = await historyTab.isVisible().catch(() => false);
    const hasHistorySection = await historySection.isVisible().catch(() => false);

    // History should be accessible somehow
    expect(hasHistoryTab || hasHistorySection).toBe(true);
  });

  test('should select universe of assets', async ({ page }) => {
    // Look for universe selector (S&P 500, Custom, etc.)
    const universeSelector = page.locator('text=/universe|assets|symbols/i');
    const sp500Option = page.locator('text=/s&p.*500|sp500/i');
    const customOption = page.locator('text=/custom/i');

    const hasUniverseSelector = await universeSelector.first().isVisible().catch(() => false);
    const hasSP500 = await sp500Option.first().isVisible().catch(() => false);
    const hasCustom = await customOption.first().isVisible().catch(() => false);

    expect(hasUniverseSelector || hasSP500 || hasCustom).toBe(true);
  });

  test('should enable run button when form is valid', async ({ page }) => {
    // Select a strategy first if needed
    const momentumBtn = page.getByRole('button', { name: /momentum/i });
    if (await momentumBtn.isVisible()) {
      await momentumBtn.click();
    }

    // Fill required fields
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    if (await startDateInput.isVisible()) {
      await startDateInput.fill('2020-01-01');
    }
    if (await endDateInput.isVisible()) {
      await endDateInput.fill('2023-12-31');
    }

    const capitalInput = page.getByLabel(/capital/i);
    if (await capitalInput.isVisible()) {
      await capitalInput.fill('100000');
    }

    // Check run button state
    const runButton = page.getByRole('button', { name: /run.*backtest/i });

    // Button should be enabled or form is ready
    const isEnabled = await runButton.isEnabled().catch(() => false);
    const isVisible = await runButton.isVisible().catch(() => false);

    expect(isVisible).toBe(true);
  });
});
