import type { Page } from '@playwright/test';

/**
 * Test utilities for TradePilot E2E tests.
 *
 * Since Firebase stores auth in IndexedDB (not captured by storageState),
 * we provide helpers that can perform login when needed.
 */

// Check if user is authenticated by checking the URL and auth state
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();

  // If on auth pages, not authenticated
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return false;
  }

  // Check for authenticated indicators in the page
  try {
    const authIndicator = page.locator('.app-container.authenticated, [data-authenticated="true"]');
    return await authIndicator.isVisible({ timeout: 1000 }).catch(() => false);
  } catch {
    return false;
  }
}

// Perform login and navigate to dashboard
export async function login(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
  }

  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Fill login form
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Click login button
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Perform admin login and navigate to admin page
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set');
  }

  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Fill login form
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Click login button
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Ensure authenticated before proceeding - logs in if needed
export async function ensureAuthenticated(page: Page): Promise<void> {
  // First navigate to dashboard to check auth status
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // If redirected to login, perform login
  if (page.url().includes('/auth/login')) {
    await login(page);
  }

  // Verify we're on dashboard
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Authentication failed. Current URL: ${page.url()}`);
  }
}

// Ensure admin authenticated before proceeding
export async function ensureAdminAuthenticated(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // If redirected to login, perform admin login
  if (page.url().includes('/auth/login')) {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Verify we're on admin
  if (!page.url().includes('/admin')) {
    throw new Error(`Admin authentication failed. Current URL: ${page.url()}`);
  }
}
