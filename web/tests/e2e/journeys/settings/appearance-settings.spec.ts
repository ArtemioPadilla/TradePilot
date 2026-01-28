/**
 * Appearance Settings User Journey
 *
 * Tests the theme and appearance configuration flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);
  });

  test('should display settings page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /settings/i });
    await expect(heading).toBeVisible();
  });

  test('should display settings navigation tabs or sections', async ({ page }) => {
    // Look for settings sections
    const accountTab = page.locator('text=/account|profile/i');
    const appearanceTab = page.locator('text=/appearance|theme/i');
    const securityTab = page.locator('text=/security|password/i');
    const connectionsTab = page.locator('text=/connection|broker/i');

    const hasAccount = await accountTab.first().isVisible().catch(() => false);
    const hasAppearance = await appearanceTab.first().isVisible().catch(() => false);
    const hasSecurity = await securityTab.first().isVisible().catch(() => false);
    const hasConnections = await connectionsTab.first().isVisible().catch(() => false);

    expect(hasAccount || hasAppearance || hasSecurity || hasConnections).toBe(true);
  });

  test('should navigate to appearance settings', async ({ page }) => {
    // Find and click appearance tab
    const appearanceTab = page.getByRole('tab', { name: /appearance/i });
    const appearanceLink = page.locator('a, button').filter({ hasText: /appearance|theme/i });

    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
    } else if (await appearanceLink.first().isVisible()) {
      await appearanceLink.first().click();
    }

    await page.waitForTimeout(300);

    // Should show theme options
    const themeSection = page.locator('text=/theme|appearance/i');
    await expect(themeSection.first()).toBeVisible();
  });

  test('should display theme options', async ({ page }) => {
    // Navigate to appearance if needed
    const appearanceTab = page.locator('text=/appearance|theme/i').first();
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(300);
    }

    // Look for theme options
    const lightOption = page.locator('text=/light/i');
    const darkOption = page.locator('text=/dark/i');
    const bloombergOption = page.locator('text=/bloomberg/i');
    const modernOption = page.locator('text=/modern/i');

    const hasLight = await lightOption.first().isVisible().catch(() => false);
    const hasDark = await darkOption.first().isVisible().catch(() => false);
    const hasBloomberg = await bloombergOption.first().isVisible().catch(() => false);
    const hasModern = await modernOption.first().isVisible().catch(() => false);

    expect(hasLight || hasDark || hasBloomberg || hasModern).toBe(true);
  });

  test('should display density options', async ({ page }) => {
    // Navigate to appearance if needed
    const appearanceTab = page.locator('text=/appearance|theme/i').first();
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(300);
    }

    // Look for density options
    const compactOption = page.locator('text=/compact/i');
    const comfortableOption = page.locator('text=/comfortable|default/i');
    const spaciousOption = page.locator('text=/spacious|relaxed/i');
    const densityLabel = page.locator('text=/density/i');

    const hasCompact = await compactOption.first().isVisible().catch(() => false);
    const hasComfortable = await comfortableOption.first().isVisible().catch(() => false);
    const hasSpacious = await spaciousOption.first().isVisible().catch(() => false);
    const hasLabel = await densityLabel.first().isVisible().catch(() => false);

    expect(hasCompact || hasComfortable || hasSpacious || hasLabel).toBe(true);
  });

  test('should apply theme change immediately', async ({ page }) => {
    // Navigate to appearance if needed
    const appearanceTab = page.locator('text=/appearance|theme/i').first();
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(300);
    }

    // Find and click dark theme
    const darkButton = page.getByRole('button', { name: /dark/i });
    const darkOption = page.locator('[data-theme="dark"], [value="dark"]');

    if (await darkButton.isVisible()) {
      await darkButton.click();
    } else if (await darkOption.isVisible()) {
      await darkOption.click();
    }

    await page.waitForTimeout(300);

    // Check if theme attribute changed
    const html = page.locator('html');
    const themeAttr = await html.getAttribute('data-theme').catch(() => null);
    const classAttr = await html.getAttribute('class').catch(() => '');

    const isDark = themeAttr?.includes('dark') || classAttr?.includes('dark');

    // Theme should have changed or selection should be visible
    const darkSelected = await page.locator('.selected, [aria-pressed="true"]')
      .filter({ hasText: /dark/i })
      .isVisible()
      .catch(() => false);

    expect(isDark || darkSelected).toBe(true);
  });

  test('should display account settings form', async ({ page }) => {
    // Navigate to account tab if needed
    const accountTab = page.locator('text=/account|profile/i').first();
    if (await accountTab.isVisible()) {
      await accountTab.click();
      await page.waitForTimeout(300);
    }

    // Look for profile fields
    const nameInput = page.getByLabel(/name|display/i);
    const emailField = page.locator('text=/email/i');

    const hasName = await nameInput.isVisible().catch(() => false);
    const hasEmail = await emailField.isVisible().catch(() => false);

    expect(hasName || hasEmail).toBe(true);
  });

  test('should display security settings section', async ({ page }) => {
    // Navigate to security tab
    const securityTab = page.locator('text=/security/i').first();
    if (await securityTab.isVisible()) {
      await securityTab.click();
      await page.waitForTimeout(300);
    }

    // Look for security options
    const passwordSection = page.locator('text=/password/i');
    const twoFactorSection = page.locator('text=/2fa|two.*factor|authenticator/i');

    const hasPassword = await passwordSection.first().isVisible().catch(() => false);
    const hasTwoFactor = await twoFactorSection.first().isVisible().catch(() => false);

    expect(hasPassword || hasTwoFactor).toBe(true);
  });

  test('should display connections settings section', async ({ page }) => {
    // Navigate to connections tab
    const connectionsTab = page.locator('text=/connection|broker/i').first();
    if (await connectionsTab.isVisible()) {
      await connectionsTab.click();
      await page.waitForTimeout(300);
    }

    // Look for broker connection
    const alpacaSection = page.locator('text=/alpaca/i');
    const brokerSection = page.locator('text=/broker|connection/i');

    const hasAlpaca = await alpacaSection.first().isVisible().catch(() => false);
    const hasBroker = await brokerSection.first().isVisible().catch(() => false);

    expect(hasAlpaca || hasBroker).toBe(true);
  });

  test('should have save button for settings', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save|update|apply/i });
    await expect(saveButton.first()).toBeVisible();
  });
});
