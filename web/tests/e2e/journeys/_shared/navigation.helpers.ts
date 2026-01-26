/**
 * Navigation Helpers for E2E Tests
 *
 * Provides reusable functions for page navigation in Playwright tests.
 */

import { type Page, expect } from '@playwright/test';

/**
 * Wait for page to be fully ready
 */
export async function waitForPageReady(page: Page, maxWait = 3000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(Math.min(maxWait, 2000));
}

/**
 * Navigate to a specific page and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageReady(page);
}

/**
 * Navigate using sidebar link
 */
export async function navigateViaSidebar(page: Page, linkText: string): Promise<void> {
  const sidebarLink = page.locator(`nav a:has-text("${linkText}")`).first();
  await sidebarLink.click();
  await waitForPageReady(page);
}

/**
 * Navigate using header navigation
 */
export async function navigateViaHeader(page: Page, linkText: string): Promise<void> {
  const headerLink = page.locator(`header a:has-text("${linkText}")`).first();
  await headerLink.click();
  await waitForPageReady(page);
}

/**
 * Click a button and wait for navigation or action to complete
 */
export async function clickAndWait(
  page: Page,
  selector: string,
  waitFor: 'navigation' | 'networkidle' | 'load' = 'networkidle'
): Promise<void> {
  const button = page.locator(selector);
  await button.click();

  if (waitFor === 'navigation') {
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  } else if (waitFor === 'networkidle') {
    await page.waitForLoadState('networkidle');
  } else {
    await page.waitForLoadState('load');
  }
}

/**
 * Wait for a specific URL pattern
 */
export async function waitForUrl(page: Page, urlPattern: string | RegExp, timeout = 10000): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Check if current page matches expected path
 */
export function isOnPage(page: Page, path: string): boolean {
  const url = new URL(page.url());
  return url.pathname === path || url.pathname.startsWith(path);
}

/**
 * Go back to previous page
 */
export async function goBack(page: Page): Promise<void> {
  await page.goBack();
  await waitForPageReady(page);
}

/**
 * Refresh current page
 */
export async function refresh(page: Page): Promise<void> {
  await page.reload();
  await waitForPageReady(page);
}

/**
 * Scroll to element and ensure it's visible
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementHidden(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.locator(selector).waitFor({ state: 'hidden', timeout });
}

/**
 * Check if element exists on page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0;
}

/**
 * Get current page title
 */
export async function getPageTitle(page: Page): Promise<string> {
  return await page.title();
}

/**
 * Verify page title contains expected text
 */
export async function verifyPageTitle(page: Page, expectedTitle: string): Promise<void> {
  await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
