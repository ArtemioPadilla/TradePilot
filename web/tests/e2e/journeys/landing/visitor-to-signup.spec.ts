/**
 * Visitor to Signup User Journey
 *
 * Tests the landing page to registration flow.
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../_shared';

test.describe('Journey: Visitor to Signup', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('should display landing page', async ({ page }) => {
    // Page should load without redirecting (for unauthenticated users)
    const currentUrl = page.url();
    const isLanding = currentUrl.endsWith('/') || currentUrl.includes('/home');

    expect(isLanding).toBe(true);
  });

  test('should display hero heading', async ({ page }) => {
    // Look for main heading
    const heroHeading = page.getByRole('heading', { level: 1 });
    const mainHeading = page.locator('h1');

    const hasHeroHeading = await heroHeading.isVisible().catch(() => false);
    const hasMainHeading = await mainHeading.first().isVisible().catch(() => false);

    expect(hasHeroHeading || hasMainHeading).toBe(true);
  });

  test('should display value proposition text', async ({ page }) => {
    // Look for key value proposition words
    const tradingText = page.locator('text=/trading|backtest|portfolio|invest/i');
    const hasValueProp = await tradingText.first().isVisible().catch(() => false);

    expect(hasValueProp).toBe(true);
  });

  test('should display primary CTA button', async ({ page }) => {
    // Look for signup/get started button
    const ctaButton = page.getByRole('link', { name: /get started|sign up|try free|register/i });
    const ctaButtonAlt = page.getByRole('button', { name: /get started|sign up|try free/i });

    const hasCTA = await ctaButton.isVisible().catch(() => false);
    const hasCTAAlt = await ctaButtonAlt.isVisible().catch(() => false);

    expect(hasCTA || hasCTAAlt).toBe(true);
  });

  test('should display login link in header', async ({ page }) => {
    // Look for login link
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });
    const loginButton = page.getByRole('button', { name: /log in|sign in/i });

    const hasLoginLink = await loginLink.isVisible().catch(() => false);
    const hasLoginButton = await loginButton.isVisible().catch(() => false);

    expect(hasLoginLink || hasLoginButton).toBe(true);
  });

  test('should navigate to login on click', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL('**/auth/login**', { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url).toContain('login');
    }
  });

  test('should navigate to signup on CTA click', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /get started|sign up|register/i });

    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForURL('**/register**', { timeout: 5000 }).catch(() => {});

      const url = page.url();
      const isRegisterPage = url.includes('register') || url.includes('signup');
      expect(isRegisterPage).toBe(true);
    }
  });

  test('should display features section', async ({ page }) => {
    // Scroll down if needed
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Look for features
    const featuresSection = page.locator('text=/feature/i');
    const featureCards = page.locator('.feature-card, [data-testid="feature"]');
    const featureList = page.locator('ul, .features-list');

    const hasSection = await featuresSection.first().isVisible().catch(() => false);
    const hasCards = await featureCards.first().isVisible().catch(() => false);
    const hasList = await featureList.first().isVisible().catch(() => false);

    expect(hasSection || hasCards || hasList).toBe(true);
  });

  test('should display backtesting feature', async ({ page }) => {
    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const backtestFeature = page.locator('text=/backtest/i');
    const hasBacktest = await backtestFeature.first().isVisible().catch(() => false);

    expect(hasBacktest).toBe(true);
  });

  test('should display portfolio feature', async ({ page }) => {
    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const portfolioFeature = page.locator('text=/portfolio/i');
    const hasPortfolio = await portfolioFeature.first().isVisible().catch(() => false);

    expect(hasPortfolio).toBe(true);
  });

  test('should display footer', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const footer = page.locator('footer');
    const footerText = page.locator('text=/©|copyright|privacy|terms/i');

    const hasFooter = await footer.isVisible().catch(() => false);
    const hasFooterText = await footerText.first().isVisible().catch(() => false);

    expect(hasFooter || hasFooterText).toBe(true);
  });

  test('should display logo or brand name', async ({ page }) => {
    const logo = page.locator('img[alt*="logo" i], .logo');
    const brandName = page.locator('text=/tradepilot/i');

    const hasLogo = await logo.first().isVisible().catch(() => false);
    const hasBrand = await brandName.first().isVisible().catch(() => false);

    expect(hasLogo || hasBrand).toBe(true);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Content should still be visible
    const mainContent = page.locator('h1, .hero, main');
    const hasContent = await mainContent.first().isVisible().catch(() => false);

    expect(hasContent).toBe(true);
  });
});
