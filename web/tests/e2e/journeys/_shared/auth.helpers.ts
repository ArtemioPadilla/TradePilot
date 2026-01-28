/**
 * Authentication Helpers for E2E Tests
 *
 * Provides reusable functions for authentication flows in Playwright tests.
 */

import { type Page, expect } from '@playwright/test';

// Environment variables for test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

/**
 * Check if the current session is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for auth indicators in the page - look for user button with name or sidebar
    const userMenu = page.locator('button:has-text("test"), button:has-text("T test"), [data-testid="user-menu"]');
    const sidebar = page.locator('aside nav, .sidebar nav');
    const dashboardHeading = page.getByRole('heading', { name: /dashboard|home|settings|trading/i });

    const hasUserMenu = await userMenu.first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasSidebar = await sidebar.first().isVisible({ timeout: 1000 }).catch(() => false);
    const hasHeading = await dashboardHeading.first().isVisible({ timeout: 1000 }).catch(() => false);

    return hasUserMenu || (hasSidebar && hasHeading);
  } catch {
    return false;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(page: Page): Promise<boolean> {
  try {
    const adminLink = page.locator('a[href="/admin"], a:has-text("Admin")');
    return await adminLink.isVisible({ timeout: 2000 }).catch(() => false);
  } catch {
    return false;
  }
}

/**
 * Perform login with regular user credentials
 */
export async function login(page: Page): Promise<void> {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set');
  }

  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill login form
  await page.getByLabel('Email').fill(TEST_USER_EMAIL);
  await page.getByLabel('Password').fill(TEST_USER_PASSWORD);

  // Submit form
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Allow auth state to stabilize
}

/**
 * Perform login with admin credentials
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables must be set');
  }

  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill login form
  await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL);
  await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD);

  // Submit form
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * Ensure the user is authenticated before proceeding
 * Performs login if not already authenticated
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  // First check if already on a dashboard page and authenticated
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/home')) {
    const authenticated = await isAuthenticated(page);
    if (authenticated) {
      return;
    }
  }

  // Navigate to dashboard to check auth status
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // Check if redirected to login or if already authenticated
  const url = page.url();
  if (url.includes('/auth/login') || url.includes('/auth/')) {
    await login(page);
  } else {
    // Already on dashboard, wait for content
    const authenticated = await isAuthenticated(page);
    if (!authenticated) {
      // If not authenticated on dashboard, go to login
      await page.goto('/auth/login');
      await login(page);
    }
  }
}

/**
 * Ensure the user is authenticated as admin before proceeding
 */
export async function ensureAdminAuthenticated(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const url = page.url();
  if (url.includes('/auth/login') || url.includes('/auth/')) {
    await loginAsAdmin(page);
    await page.goto('/admin');
  }

  // Verify admin access
  const isAdminUser = await isAdmin(page);
  if (!isAdminUser) {
    throw new Error('User does not have admin access');
  }
}

/**
 * Perform logout
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  const userMenuBtn = page.locator('.user-menu-btn, [data-testid="user-menu"]');
  if (await userMenuBtn.isVisible()) {
    await userMenuBtn.click();

    // Click logout button
    const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout")');
    await logoutBtn.click();

    // Wait for redirect to login page
    await page.waitForURL('**/auth/login**', { timeout: 10000 });
  }
}

/**
 * Clear authentication state (useful for testing unauthenticated flows)
 */
export async function clearAuthState(page: Page): Promise<void> {
  // First navigate to the app to ensure we're in the right origin
  // This is needed because localStorage is not accessible from about:blank
  const currentUrl = page.url();
  if (!currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  }

  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore errors if storage is not accessible
    }
  });

  // Clear IndexedDB (Firebase auth storage)
  await page.evaluate(async () => {
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch {
      // Ignore errors if IndexedDB is not accessible
    }
  });
}
