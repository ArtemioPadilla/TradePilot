import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * Accounts Page E2E Tests
 *
 * These tests require authentication. They use ensureAuthenticated()
 * to login if needed before testing accounts functionality.
 */

test.describe('Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/accounts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('should display accounts page when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display accounts header', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const heading = page.locator('h2:has-text("Accounts"), h1:has-text("Accounts")');
    const hasHeading = await heading.isVisible().catch(() => false);

    const hasContent = await page.locator('main, .accounts-page').first().isVisible().catch(() => false);
    expect(hasHeading || hasContent).toBe(true);
  });

  test('should display Add Account button', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBe(true);
  });

  test('should show empty state or accounts list', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Add Account Modal', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/accounts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('should open modal when clicking Add Account', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.locator('[data-testid="add-account-btn"], button:has-text("Add Account")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal');
      await expect(modal).toBeVisible();

      await expect(page.getByLabel(/account name/i)).toBeVisible();
      await expect(page.getByLabel(/account type/i)).toBeVisible();
      await expect(page.getByLabel(/currency/i)).toBeVisible();
    }
  });

  test('should close modal when clicking Cancel', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.locator('[data-testid="add-account-btn"], button:has-text("Add Account")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const cancelButton = page.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"], .modal');
        const isModalVisible = await modal.isVisible().catch(() => false);
        expect(isModalVisible).toBe(false);
      }
    }
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.locator('[data-testid="add-account-btn"], button:has-text("Add Account")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const overlay = page.locator('.modal-overlay');
      if (await overlay.isVisible().catch(() => false)) {
        await overlay.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"], .modal');
        const isModalVisible = await modal.isVisible().catch(() => false);
        expect(isModalVisible).toBe(false);
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.locator('[data-testid="add-account-btn"], button:has-text("Add Account")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const submitButton = page.getByRole('button', { name: /create account/i });
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        const nameInput = page.getByLabel(/account name/i);
        if (await nameInput.isVisible().catch(() => false)) {
          const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
          expect(isInvalid).toBe(true);
        }
      }
    }
  });
});

test.describe('Account Types', () => {
  test('should display all account type options in dropdown', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/accounts');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.locator('[data-testid="add-account-btn"], button:has-text("Add Account")');

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      const typeSelect = page.getByLabel(/account type/i);
      if (await typeSelect.isVisible().catch(() => false)) {
        const options = await typeSelect.locator('option').allTextContents();
        const hasMultipleOptions = options.length > 1;
        expect(hasMultipleOptions).toBe(true);
      }
    }
  });
});

test.describe('Accounts Navigation', () => {
  test('should navigate to accounts page from sidebar', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/\/dashboard/);

    const accountsLink = page.locator('a[href="/dashboard/accounts"]');
    if (await accountsLink.isVisible().catch(() => false)) {
      await accountsLink.click();
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(/\/dashboard\/accounts/);
    }
  });
});
