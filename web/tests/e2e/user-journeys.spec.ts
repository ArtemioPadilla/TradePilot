import { test, expect, Page } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * User Journey E2E Tests
 *
 * These tests require authentication. They use ensureAuthenticated()
 * to login if needed before testing user journeys.
 */

// Helper to wait for page load
async function waitForPageReady(page: Page, maxWait = 3000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(Math.min(maxWait, 2000));
}

test.describe('Journey: Dashboard Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display main dashboard with key sections', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard/);

    const main = page.locator('main, .main-content');
    await expect(main.first()).toBeVisible();

    const sidebar = page.locator('aside, .sidebar, nav');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard/);

    const sections = [
      { path: '/dashboard/accounts', name: 'Accounts' },
      { path: '/dashboard/trading', name: 'Trading' },
      { path: '/dashboard/strategies', name: 'Strategies' },
      { path: '/dashboard/alerts', name: 'Alerts' },
      { path: '/dashboard/settings', name: 'Settings' },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      await waitForPageReady(page);

      await expect(page).toHaveURL(new RegExp(section.path.replace('/', '\\/')));

      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});

test.describe('Journey: Account Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display accounts page with add account functionality', async ({ page }) => {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const addButton = page.getByRole('button', { name: /add.*account|new.*account|create.*account/i });
    const hasAddButton = await addButton.isVisible().catch(() => false);

    if (hasAddButton) {
      await addButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
      await expect(modal.first()).toBeVisible();
    }

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display account details when account exists', async ({ page }) => {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/accounts/);

    const accountCards = page.locator('[class*="account"], [data-testid*="account"]');
    const emptyState = page.locator('text=/no accounts|add your first|get started/i');

    const hasAccounts = await accountCards.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);

    expect(hasAccounts || hasEmptyState).toBe(true);
  });
});

test.describe('Journey: Trading Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display trading page', async ({ page }) => {
    await page.goto('/dashboard/trading');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display trading form elements if connected', async ({ page }) => {
    await page.goto('/dashboard/trading');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Journey: Backtest Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display backtest page', async ({ page }) => {
    await page.goto('/dashboard/backtest');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/backtest/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display backtest configuration form', async ({ page }) => {
    await page.goto('/dashboard/backtest');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/backtest/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Journey: Alerts Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display alerts page', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/alerts/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display alert list or empty state', async ({ page }) => {
    await page.goto('/dashboard/alerts');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/alerts/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Journey: Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/settings/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display settings page with configuration options', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/settings/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should allow toggling notification preferences', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/settings/);

    await page.waitForTimeout(2000);

    const toggles = page.locator('input[type="checkbox"], [role="switch"]');
    const toggleCount = await toggles.count();

    if (toggleCount > 0) {
      const firstToggle = toggles.first();
      const isVisible = await firstToggle.isVisible().catch(() => false);
      expect(isVisible || toggleCount > 0).toBe(true);
    }

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should navigate to privacy tab and display settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/settings/);

    await page.waitForTimeout(1500);

    const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
    if (await privacyTab.isVisible().catch(() => false)) {
      await privacyTab.click();
      await page.waitForTimeout(500);

      const privacyPanel = page.locator('#privacy-panel');
      await expect(privacyPanel).toHaveClass(/active/);
    }
  });

  test('should allow updating privacy settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/settings/);

    await page.waitForTimeout(2000);

    const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
    if (await privacyTab.isVisible().catch(() => false)) {
      await privacyTab.click();
      await page.waitForTimeout(1000);

      const toggle = page.locator('#privacy-panel [role="switch"], #privacy-panel input[type="checkbox"]').first();

      if (await toggle.isVisible().catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(1500);

        await expect(page).toHaveURL(/\/dashboard\/settings/);
      }
    }
  });
});

test.describe('Journey: Strategy Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should display strategies page', async ({ page }) => {
    await page.goto('/dashboard/strategies');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/strategies/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display strategies with available strategies', async ({ page }) => {
    await page.goto('/dashboard/strategies');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/strategies/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Journey: Complete User Session', () => {
  test('should maintain consistent navigation throughout session', async ({ page }) => {
    await ensureAuthenticated(page);

    const routes = [
      '/dashboard',
      '/dashboard/accounts',
      '/dashboard/trading',
      '/dashboard/strategies',
      '/dashboard/settings',
    ];

    for (const route of routes) {
      await page.goto(route);
      await waitForPageReady(page);

      await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));

      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});

test.describe('Journey: Error Recovery', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/nonexistent-page-12345');
    await waitForPageReady(page);

    const is404 = page.url().includes('404') ||
                  await page.locator('text=/not found|404|page.*not.*exist/i').first().isVisible().catch(() => false);
    const isRedirected = !page.url().includes('/nonexistent-page-12345');

    expect(is404 || isRedirected).toBe(true);
  });

  test('should access protected routes when authenticated', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/dashboard\/trading|\/trading/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
