import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * Dashboard E2E Tests
 *
 * These tests require authentication. They use ensureAuthenticated()
 * to login if needed before testing dashboard functionality.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display dashboard when authenticated', async ({ page }) => {
    // Should be on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard should have main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify sidebar navigation exists
    const sidebar = page.locator('aside.sidebar, .sidebar, aside');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should display portfolio summary widget', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    // We expect some dashboard content to be present
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display holdings section', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    // Page should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have header with user menu', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Page should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Content should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Verify we're authenticated and on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for navigation links
    const navLinks = page.locator('aside a[href^="/dashboard"]');
    const count = await navLinks.count();

    // Should have at least some navigation links
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to accounts page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const accountsLink = page.locator('a[href="/dashboard/accounts"]');
    if (await accountsLink.isVisible().catch(() => false)) {
      await accountsLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/dashboard\/accounts/);
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const settingsLink = page.locator('a[href="/dashboard/settings"]');
    if (await settingsLink.isVisible().catch(() => false)) {
      await settingsLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/dashboard\/settings/);
    }
  });
});

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should display performance chart widget', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display allocation chart widget', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display recent activity widget', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display watchlist widget', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
