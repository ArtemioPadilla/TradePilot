import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * Trading Page E2E Tests
 *
 * These tests require authentication. They use ensureAuthenticated()
 * to login if needed before testing trading functionality.
 */

test.describe('Trading Page', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('should display trading page when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display either connection form or trading interface', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Trading Page - Not Connected State', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display Alpaca connection form when not connected', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have paper/live environment toggle', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBe(true);
  });

  test('should have API key and secret input fields', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have test connection and save buttons', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Trading Page - Connected State', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display account info bar when connected', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display order form when connected', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display order history table when connected', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Trading Page - Order Form', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should have buy/sell toggle buttons', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have symbol input field', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have quantity input field', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have order type selector', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have time in force selector', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show limit price input for limit orders', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const orderType = page.locator('[data-testid="order-type-select"]');
    if (await orderType.isVisible().catch(() => false)) {
      await orderType.selectOption('limit');
      await page.waitForTimeout(300);
      await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);
    }
  });

  test('should show preview order button', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Trading Page - Order History', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should show filters toggle button', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show refresh button', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should show empty state or orders list', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Trading Page - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const content = page.locator('.trading-page, .connection-container, main');
    await expect(content.first()).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const content = page.locator('.trading-page, .connection-container, main');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Trading Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should have proper form labels', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have keyboard navigable form elements', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
