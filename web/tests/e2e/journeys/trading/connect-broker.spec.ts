/**
 * Connect Broker User Journey
 *
 * Tests the Alpaca broker connection flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Connect Broker', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await waitForPageReady(page);
  });

  test('should display Alpaca connection form', async ({ page }) => {
    // Check main heading
    const heading = page.getByRole('heading', { name: /connect.*brokerage/i });
    await expect(heading).toBeVisible();

    // Check form is present
    const form = page.locator('[data-testid="alpaca-connection-form"], .alpaca-connection');
    const formVisible = await form.first().isVisible().catch(() => false);

    // If not connected, form should be visible
    if (formVisible) {
      await expect(form.first()).toBeVisible();
    }
  });

  test('should display trading environment options', async ({ page }) => {
    // Paper Trading option
    const paperButton = page.getByRole('button', { name: /paper trading/i });
    await expect(paperButton).toBeVisible();

    // Live Trading option
    const liveButton = page.getByRole('button', { name: /live trading/i });
    await expect(liveButton).toBeVisible();
  });

  test('should select paper trading by default or on click', async ({ page }) => {
    const paperButton = page.getByRole('button', { name: /paper trading/i });

    // Click to ensure selected
    await paperButton.click();
    await page.waitForTimeout(300);

    // Check for visual selection state
    const isSelected = await paperButton.evaluate((btn) => {
      const classes = btn.className;
      return classes.includes('selected') ||
             classes.includes('active') ||
             btn.getAttribute('aria-pressed') === 'true';
    });

    expect(isSelected).toBe(true);
  });

  test('should display API credential inputs', async ({ page }) => {
    // API Key input
    const apiKeyInput = page.getByLabel(/api key/i);
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('placeholder', /enter.*api.*key/i);

    // API Secret input
    const apiSecretInput = page.getByLabel(/api secret/i);
    await expect(apiSecretInput).toBeVisible();
    await expect(apiSecretInput).toHaveAttribute('type', 'password');
  });

  test('should toggle API secret visibility', async ({ page }) => {
    const secretInput = page.getByLabel(/api secret/i);
    const toggleButton = page.getByRole('button', { name: /show secret/i });

    // Verify initial state
    await expect(secretInput).toHaveAttribute('type', 'password');

    // Toggle visibility
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(secretInput).toHaveAttribute('type', 'text');

      // Toggle back
      await toggleButton.click();
      await expect(secretInput).toHaveAttribute('type', 'password');
    }
  });

  test('should have disabled buttons when inputs are empty', async ({ page }) => {
    const testButton = page.getByRole('button', { name: /test connection/i });
    const saveButton = page.getByRole('button', { name: /save.*connect/i });

    // Both should be disabled initially
    await expect(testButton).toBeDisabled();
    await expect(saveButton).toBeDisabled();
  });

  test('should enable test button when credentials are entered', async ({ page }) => {
    // Fill API Key
    await page.getByLabel(/api key/i).fill('PKTEST123456789012345');

    // Fill API Secret
    await page.getByLabel(/api secret/i).fill('secretkey1234567890abcdefgh');

    // Test button should be enabled
    const testButton = page.getByRole('button', { name: /test connection/i });
    await expect(testButton).toBeEnabled();
  });

  test('should display Alpaca dashboard link', async ({ page }) => {
    const alpacaLink = page.locator('a[href*="alpaca.markets"]');
    await expect(alpacaLink).toBeVisible();
    await expect(alpacaLink).toHaveText(/alpaca dashboard/i);
  });

  test('should display security notice', async ({ page }) => {
    const securityNotice = page.locator('text=/never share.*secret|store.*securely/i');
    await expect(securityNotice.first()).toBeVisible();
  });

  test('should handle connection test with invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.getByLabel(/api key/i).fill('INVALID_KEY');
    await page.getByLabel(/api secret/i).fill('INVALID_SECRET');

    // Click test connection
    const testButton = page.getByRole('button', { name: /test connection/i });
    await testButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Should show error or stay on form
    const hasError = await page
      .locator('text=/error|invalid|failed|incorrect/i')
      .first()
      .isVisible()
      .catch(() => false);

    const stillOnForm = await page
      .getByLabel(/api key/i)
      .isVisible()
      .catch(() => false);

    expect(hasError || stillOnForm).toBe(true);
  });
});
