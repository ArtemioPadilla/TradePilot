/**
 * Export Data User Journey
 *
 * Tests the data export functionality.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Export Data', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('should display export option in dashboard', async ({ page }) => {
    // Look for export button or link
    const exportButton = page.getByRole('button', { name: /export/i });
    const exportLink = page.locator('a').filter({ hasText: /export/i });
    const reportsLink = page.locator('a[href*="report"]');

    const hasExportButton = await exportButton.first().isVisible().catch(() => false);
    const hasExportLink = await exportLink.first().isVisible().catch(() => false);
    const hasReportsLink = await reportsLink.first().isVisible().catch(() => false);

    expect(hasExportButton || hasExportLink || hasReportsLink).toBe(true);
  });

  test('should display CSV export option', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for CSV option
    const csvButton = page.getByRole('button', { name: /csv/i });
    const csvOption = page.locator('text=/csv/i');

    const hasCSVButton = await csvButton.isVisible().catch(() => false);
    const hasCSVOption = await csvOption.first().isVisible().catch(() => false);

    expect(hasCSVButton || hasCSVOption).toBe(true);
  });

  test('should display PDF export option', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for PDF option
    const pdfButton = page.getByRole('button', { name: /pdf/i });
    const pdfOption = page.locator('text=/pdf/i');

    const hasPDFButton = await pdfButton.isVisible().catch(() => false);
    const hasPDFOption = await pdfOption.first().isVisible().catch(() => false);

    expect(hasPDFButton || hasPDFOption).toBe(true);
  });

  test('should display JSON export option', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for JSON option
    const jsonButton = page.getByRole('button', { name: /json/i });
    const jsonOption = page.locator('text=/json/i');

    const hasJSONButton = await jsonButton.isVisible().catch(() => false);
    const hasJSONOption = await jsonOption.first().isVisible().catch(() => false);

    expect(hasJSONButton || hasJSONOption).toBe(true);
  });

  test('should display date range selector', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for date range inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateRangeLabel = page.locator('text=/date.*range|period|from.*to/i');

    const hasDateInputs = await dateInputs.first().isVisible().catch(() => false);
    const hasDateLabel = await dateRangeLabel.first().isVisible().catch(() => false);

    expect(hasDateInputs || hasDateLabel).toBe(true);
  });

  test('should display report type selector', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for report type options
    const reportTypeSelector = page.getByLabel(/type|report/i);
    const performanceOption = page.locator('text=/performance/i');
    const taxOption = page.locator('text=/tax/i');
    const holdingsOption = page.locator('text=/holding/i');

    const hasSelector = await reportTypeSelector.isVisible().catch(() => false);
    const hasPerformance = await performanceOption.first().isVisible().catch(() => false);
    const hasTax = await taxOption.first().isVisible().catch(() => false);
    const hasHoldings = await holdingsOption.first().isVisible().catch(() => false);

    expect(hasSelector || hasPerformance || hasTax || hasHoldings).toBe(true);
  });

  test('should display generate report button', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for generate button
    const generateButton = page.getByRole('button', { name: /generate|create|run/i });

    const hasGenerateButton = await generateButton.first().isVisible().catch(() => false);

    expect(hasGenerateButton).toBe(true);
  });

  test('should display account selector for reports', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for account selection
    const accountSelector = page.locator('text=/account|portfolio/i');
    const checkboxes = page.locator('input[type="checkbox"]');

    const hasAccountSelector = await accountSelector.first().isVisible().catch(() => false);
    const hasCheckboxes = await checkboxes.first().isVisible().catch(() => false);

    expect(hasAccountSelector || hasCheckboxes).toBe(true);
  });

  test('should display report preview area', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for preview area
    const previewArea = page.locator('.report-preview, [data-testid="preview"]');
    const previewLabel = page.locator('text=/preview|summary|result/i');

    const hasPreviewArea = await previewArea.isVisible().catch(() => false);
    const hasPreviewLabel = await previewLabel.first().isVisible().catch(() => false);

    expect(hasPreviewArea || hasPreviewLabel).toBe(true);
  });

  test('should have tax report section', async ({ page }) => {
    // Navigate to reports if available
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for tax report option
    const taxReport = page.locator('text=/tax.*report|capital.*gain|fiscal/i');

    const hasTaxReport = await taxReport.first().isVisible().catch(() => false);

    expect(hasTaxReport).toBe(true);
  });
});
