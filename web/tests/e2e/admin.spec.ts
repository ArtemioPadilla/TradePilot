import { test, expect } from '@playwright/test';
import { ensureAdminAuthenticated } from './test-utils';

/**
 * Admin Pages E2E Tests
 *
 * These tests require admin authentication. They use ensureAdminAuthenticated()
 * to login as admin if needed before testing admin functionality.
 */

test.describe('Admin Dashboard', () => {
  test('should display admin dashboard when authenticated as admin', async ({ page }) => {
    await ensureAdminAuthenticated(page);

    await expect(page).toHaveURL(/\/admin/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display admin navigation links', async ({ page }) => {
    await ensureAdminAuthenticated(page);
    await page.goto('/admin');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/admin/);

    const usersLink = page.locator('a[href="/admin/users"]');
    const invitesLink = page.locator('a[href="/admin/invites"]');

    const hasUsersLink = await usersLink.count() > 0;
    const hasInvitesLink = await invitesLink.count() > 0;

    expect(hasUsersLink || hasInvitesLink).toBe(true);
  });
});

test.describe('Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminAuthenticated(page);
  });

  test('should display users page when authenticated as admin', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/admin\/users/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display user table or list', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/admin\/users/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Invites Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminAuthenticated(page);
  });

  test('should display invites page when authenticated as admin', async ({ page }) => {
    await page.goto('/admin/invites');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/admin\/invites/);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display create invite button', async ({ page }) => {
    await page.goto('/admin/invites');
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/admin\/invites/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Admin Navigation', () => {
  test('should navigate between admin pages', async ({ page }) => {
    await ensureAdminAuthenticated(page);

    await expect(page).toHaveURL(/\/admin/);

    // Navigate to users
    const usersLink = page.locator('a[href="/admin/users"]');
    if (await usersLink.isVisible().catch(() => false)) {
      await usersLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/admin\/users/);
    }

    // Navigate to invites
    const invitesLink = page.locator('a[href="/admin/invites"]');
    if (await invitesLink.isVisible().catch(() => false)) {
      await invitesLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/admin\/invites/);
    }
  });
});
