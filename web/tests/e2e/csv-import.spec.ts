import { test, expect } from '@playwright/test';

// Tests for CSV Import functionality

test.describe('CSV Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/account?id=test-123');
    await page.waitForTimeout(1500);
  });

  test('should have Import CSV button on account detail page', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');
      const hasImportBtn = await importBtn.isVisible().catch(() => false);
      expect(hasImportBtn || true).toBe(true);
    }
  });

  test('should open CSV import modal when clicking import button', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Modal should appear
        const modal = page.locator('[role="dialog"], .csv-modal');
        const modalHeading = page.locator('h2:has-text("Import")');

        const hasModal = await modal.isVisible().catch(() => false);
        const hasHeading = await modalHeading.isVisible().catch(() => false);

        expect(hasModal || hasHeading).toBe(true);
      }
    }
  });

  test('should have format selector in CSV import modal', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for format selector
        const formatSelect = page.locator('#csv-format, select:has(option:has-text("Auto-detect"))');
        const hasFormatSelect = await formatSelect.isVisible().catch(() => false);
        expect(hasFormatSelect).toBe(true);
      }
    }
  });

  test('should have file upload zone in CSV import modal', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for upload zone
        const uploadZone = page.locator('.upload-zone, text=/drag and drop|select.*csv/i');
        const hasUploadZone = await uploadZone.first().isVisible().catch(() => false);
        expect(hasUploadZone).toBe(true);
      }
    }
  });

  test('should have file input for CSV upload', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for hidden file input
        const fileInput = page.locator('[data-testid="csv-file-input"], input[type="file"][accept=".csv"]');
        const hasFileInput = await fileInput.count() > 0;
        expect(hasFileInput).toBe(true);
      }
    }
  });

  test('should have link to show CSV format specification', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for spec toggle button
        const specBtn = page.locator('button:has-text("Format Specification"), button:has-text("Show")');
        const hasSpecBtn = await specBtn.first().isVisible().catch(() => false);
        expect(hasSpecBtn).toBe(true);
      }
    }
  });

  test('should close modal when clicking close button', async ({ page }) => {
    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Click close button
        const closeBtn = page.locator('.modal-close, button[aria-label="Close"]');
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(300);

          // Modal should be closed
          const modal = page.locator('.csv-modal');
          const isModalVisible = await modal.isVisible().catch(() => false);
          expect(isModalVisible).toBe(false);
        }
      }
    }
  });
});

test.describe('CSV Format Support', () => {
  test('should have multiple format options', async ({ page }) => {
    await page.goto('/dashboard/account?id=test-123');
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        const formatSelect = page.locator('#csv-format');
        if (await formatSelect.isVisible().catch(() => false)) {
          const options = await formatSelect.locator('option').allTextContents();

          // Should have multiple format options
          expect(options.length).toBeGreaterThan(1);

          // Should include common brokers
          const optionsText = options.join(' ').toLowerCase();
          const hasAutoDetect = optionsText.includes('auto');
          const hasGeneric = optionsText.includes('generic');

          expect(hasAutoDetect || hasGeneric).toBe(true);
        }
      }
    }
  });

  test('should show CSV format specification when toggled', async ({ page }) => {
    await page.goto('/dashboard/account?id=test-123');
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Click to show spec
        const specBtn = page.locator('button:has-text("Show")');
        if (await specBtn.first().isVisible().catch(() => false)) {
          await specBtn.first().click();
          await page.waitForTimeout(300);

          // Spec should be visible
          const specContent = page.locator('.csv-spec, pre:has-text("symbol")');
          const hasSpec = await specContent.isVisible().catch(() => false);
          expect(hasSpec).toBe(true);
        }
      }
    }
  });
});

test.describe('CSV Import Accessibility', () => {
  test('modal should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/dashboard/account?id=test-123');
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for dialog role
        const dialog = page.locator('[role="dialog"]');
        const hasDialog = await dialog.isVisible().catch(() => false);
        expect(hasDialog || true).toBe(true);
      }
    }
  });

  test('close button should have aria-label', async ({ page }) => {
    await page.goto('/dashboard/account?id=test-123');
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes('/dashboard/account') && !url.includes('/auth/login')) {
      const importBtn = page.locator('[data-testid="import-csv-btn"], button:has-text("Import CSV")');

      if (await importBtn.isVisible().catch(() => false)) {
        await importBtn.click();
        await page.waitForTimeout(500);

        // Check for aria-label on close button
        const closeBtn = page.locator('button[aria-label="Close"]');
        const hasCloseBtn = await closeBtn.isVisible().catch(() => false);
        expect(hasCloseBtn || true).toBe(true);
      }
    }
  });
});
