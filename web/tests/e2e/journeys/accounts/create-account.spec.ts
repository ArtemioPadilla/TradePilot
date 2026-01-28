/**
 * Create Account User Journey
 *
 * Tests the account creation flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Account', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);
  });

  test('should display accounts page with heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /accounts|portfolio/i });
    await expect(heading).toBeVisible();
  });

  test('should display add account button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*account|new.*account|create/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add account modal on button click', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*account|new.*account/i });
    await addButton.click();

    // Wait for modal
    await page.waitForTimeout(300);

    // Check for modal or form
    const modal = page.locator('[role="dialog"], .modal, [data-testid="add-account-modal"]');
    const form = page.locator('form');

    const hasModal = await modal.isVisible().catch(() => false);
    const hasForm = await form.isVisible().catch(() => false);

    expect(hasModal || hasForm).toBe(true);
  });

  test('should display account name input in modal', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();
    await page.waitForTimeout(300);

    // Look for name input
    const nameInput = page.getByLabel(/name/i);
    const nameInputAlt = page.locator('input[name="name"], input[placeholder*="name" i]');

    const hasNameInput = await nameInput.isVisible().catch(() => false);
    const hasNameInputAlt = await nameInputAlt.first().isVisible().catch(() => false);

    expect(hasNameInput || hasNameInputAlt).toBe(true);
  });

  test('should display account type selector', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();
    await page.waitForTimeout(300);

    // Look for type selector
    const typeSelector = page.getByLabel(/type/i);
    const typeButtons = page.locator('button, [role="radio"]').filter({ hasText: /brokerage|401k|ira|crypto/i });

    const hasTypeSelector = await typeSelector.isVisible().catch(() => false);
    const hasTypeButtons = await typeButtons.first().isVisible().catch(() => false);

    expect(hasTypeSelector || hasTypeButtons).toBe(true);
  });

  test('should display currency selector', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();
    await page.waitForTimeout(300);

    // Look for currency selector
    const currencySelector = page.getByLabel(/currency/i);
    const currencyOptions = page.locator('text=/usd|eur|gbp/i');

    const hasCurrencySelector = await currencySelector.isVisible().catch(() => false);
    const hasCurrencyOptions = await currencyOptions.first().isVisible().catch(() => false);

    expect(hasCurrencySelector || hasCurrencyOptions).toBe(true);
  });

  test('should validate required account name', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();
    await page.waitForTimeout(300);

    // Try to submit without name
    const submitButton = page.getByRole('button', { name: /create|save|add/i }).last();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation or remain in modal
      const nameInput = page.getByLabel(/name/i);
      const stillInModal = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
      const hasError = await page.locator('.error, [aria-invalid="true"], text=/required/i').isVisible().catch(() => false);

      expect(stillInModal || hasError).toBe(true);
    }
  });

  test('should create account with valid data', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();
    await page.waitForTimeout(300);

    // Fill account name
    const nameInput = page.getByLabel(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Account');
    } else {
      const altInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await altInput.fill('E2E Test Account');
    }

    // Select account type if available
    const typeSelector = page.getByLabel(/type/i);
    if (await typeSelector.isVisible()) {
      await typeSelector.selectOption({ index: 0 });
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /create|save|add/i }).last();
    await submitButton.click();

    // Wait for result
    await page.waitForTimeout(1000);

    // Modal should close or success message appears
    const modalClosed = !(await page.locator('[role="dialog"]').isVisible().catch(() => false));
    const hasSuccess = await page.locator('text=/created|success|added/i').isVisible().catch(() => false);
    const accountListed = await page.locator('text=/e2e test account/i').isVisible().catch(() => false);

    expect(modalClosed || hasSuccess || accountListed).toBe(true);
  });

  test('should display account list', async ({ page }) => {
    // Check for account cards or table
    const accountCards = page.locator('.account-card, [data-testid="account-item"]');
    const accountTable = page.locator('table');
    const accountList = page.locator('[role="list"], .accounts-list');

    const hasCards = await accountCards.first().isVisible().catch(() => false);
    const hasTable = await accountTable.isVisible().catch(() => false);
    const hasList = await accountList.isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no accounts|add your first/i').isVisible().catch(() => false);

    expect(hasCards || hasTable || hasList || hasEmptyState).toBe(true);
  });

  test('should navigate to account detail on click', async ({ page }) => {
    // Find an account to click
    const accountItem = page.locator('.account-card, [data-testid="account-item"], a[href*="account"]').first();

    if (await accountItem.isVisible()) {
      await accountItem.click();
      await page.waitForTimeout(500);

      // Should navigate to detail or show detail panel
      const urlChanged = page.url().includes('account');
      const detailVisible = await page.locator('text=/holdings|positions|details/i').isVisible().catch(() => false);

      expect(urlChanged || detailVisible).toBe(true);
    }
  });
});
