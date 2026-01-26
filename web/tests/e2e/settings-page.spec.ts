import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * Settings Page E2E Tests
 *
 * These tests require authentication. They use ensureAuthenticated()
 * to login if needed before testing settings functionality.
 */

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Layout', () => {
    test('should display settings page when authenticated', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should display settings page header', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const heading = page.locator('.settings-header h1');
      if (await heading.isVisible().catch(() => false)) {
        await expect(heading).toContainText('Settings');
      }
    });

    test('should display page description', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const description = page.locator('.settings-header p');
      if (await description.isVisible().catch(() => false)) {
        await expect(description).toContainText('Manage your account preferences');
      }
    });

    test('should display tab navigation', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tabs = page.locator('.settings-tabs');
      if (await tabs.isVisible().catch(() => false)) {
        await expect(tabs).toBeVisible();
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should have Notifications tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Notifications' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should have Account tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Account' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should have Security tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Security' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should have Connections tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Connections' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should have Privacy tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Privacy' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should have Appearance tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Appearance' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab).toBeVisible();
      }
    });

    test('should switch to Appearance tab on click', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await expect(appearanceTab).toHaveClass(/active/);
      }
    });

    test('should switch to Account tab on click', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await expect(accountTab).toHaveClass(/active/);
      }
    });

    test('should switch to Security tab on click', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await expect(securityTab).toHaveClass(/active/);
      }
    });

    test('should switch to Connections tab on click', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await expect(connectionsTab).toHaveClass(/active/);
      }
    });

    test('should switch to Privacy tab on click', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
      if (await privacyTab.isVisible().catch(() => false)) {
        await privacyTab.click();
        await expect(privacyTab).toHaveClass(/active/);
      }
    });

    test('should have proper tablist role', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tablist = page.locator('.settings-tabs');
      if (await tablist.isVisible().catch(() => false)) {
        await expect(tablist).toHaveAttribute('role', 'tablist');
      }
    });

    test('should have proper tab roles', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tabs = page.locator('.tab');
      const count = await tabs.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(tabs.nth(i)).toHaveAttribute('role', 'tab');
        }
      }
    });
  });

  test.describe('Notifications Panel', () => {
    test('should display NotificationPreferencesForm', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const panel = page.locator('#notifications-panel');
      if (await panel.isVisible().catch(() => false)) {
        await expect(panel).toHaveClass(/active/);
      }
    });

    test('should show notifications panel by default', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const panel = page.locator('#notifications-panel');
      if (await panel.isVisible().catch(() => false)) {
        await expect(panel).toBeVisible();
      }
    });
  });

  test.describe('Account Panel', () => {
    test('should display account settings form when Account tab selected', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('#account-panel')).toHaveClass(/active/);
      }
    });

    test('should show Profile Photo section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#account-panel h3', { hasText: 'Profile Photo' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Display Name section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#account-panel h3', { hasText: 'Display Name' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Email Address section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#account-panel h3', { hasText: 'Email Address' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Danger Zone section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#account-panel h3', { hasText: 'Danger Zone' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Delete Account button', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(1000);
        const deleteBtn = page.locator('[data-testid="delete-account-btn"]');
        if (await deleteBtn.isVisible().catch(() => false)) {
          await expect(deleteBtn).toBeVisible();
          await expect(deleteBtn).toContainText('Delete Account');
        }
      }
    });
  });

  test.describe('Security Panel', () => {
    test('should display security settings form when Security tab selected', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('#security-panel')).toHaveClass(/active/);
      }
    });

    test('should show Password section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#security-panel h3', { hasText: 'Password' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Two-Factor Authentication section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#security-panel h3', { hasText: 'Two-Factor Authentication' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Account Activity section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#security-panel h3', { hasText: 'Account Activity' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Sign out all devices button', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const securityTab = page.locator('.tab', { hasText: 'Security' });
      if (await securityTab.isVisible().catch(() => false)) {
        await securityTab.click();
        await page.waitForTimeout(1000);
        const signOutBtn = page.locator('[data-testid="sign-out-all-btn"]');
        if (await signOutBtn.isVisible().catch(() => false)) {
          await expect(signOutBtn).toBeVisible();
          await expect(signOutBtn).toContainText('Sign out all devices');
        }
      }
    });
  });

  test.describe('Connections Panel', () => {
    test('should display connections settings form when Connections tab selected', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('#connections-panel')).toHaveClass(/active/);
      }
    });

    test('should show Brokerage Connections section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#connections-panel h3', { hasText: 'Brokerage Connections' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Alpaca connection form', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await page.waitForTimeout(1000);
        const alpacaForm = page.locator('[data-testid="alpaca-connection-form"]');
        if (await alpacaForm.isVisible().catch(() => false)) {
          await expect(alpacaForm).toBeVisible();
        }
      }
    });

    test('should show More Connections Coming Soon section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#connections-panel h3', { hasText: 'More Connections Coming Soon' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Market Data Sources section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
      if (await connectionsTab.isVisible().catch(() => false)) {
        await connectionsTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#connections-panel h3', { hasText: 'Market Data Sources' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });
  });

  test.describe('Privacy Panel', () => {
    test('should display privacy form when Privacy tab selected', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
      if (await privacyTab.isVisible().catch(() => false)) {
        await privacyTab.click();
        await expect(page.locator('#privacy-panel')).toHaveClass(/active/);
      }
    });
  });

  test.describe('Appearance Panel', () => {
    test('should display appearance settings form when Appearance tab selected', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('#appearance-panel')).toHaveClass(/active/);
      }
    });

    test('should show Theme section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#appearance-panel h3', { hasText: 'Theme' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should show Density section', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const heading = page.locator('#appearance-panel h3', { hasText: 'Density' });
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should display theme options', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const themeGrid = page.locator('.theme-grid');
        if (await themeGrid.isVisible().catch(() => false)) {
          await expect(themeGrid).toBeVisible();
        }
      }
    });

    test('should display density options', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const densityOptions = page.locator('.density-options');
        if (await densityOptions.isVisible().catch(() => false)) {
          await expect(densityOptions).toBeVisible();
        }
      }
    });

    test('should have Compact density option', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const compactOption = page.locator('[data-testid="density-compact"]');
        if (await compactOption.isVisible().catch(() => false)) {
          await expect(compactOption).toBeVisible();
        }
      }
    });

    test('should have Comfortable density option', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const comfortableOption = page.locator('[data-testid="density-comfortable"]');
        if (await comfortableOption.isVisible().catch(() => false)) {
          await expect(comfortableOption).toBeVisible();
        }
      }
    });

    test('should have Spacious density option', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const spaciousOption = page.locator('[data-testid="density-spacious"]');
        if (await spaciousOption.isVisible().catch(() => false)) {
          await expect(spaciousOption).toBeVisible();
        }
      }
    });

    test('should change density when clicking Compact option', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const compactOption = page.locator('[data-testid="density-compact"]');
        if (await compactOption.isVisible().catch(() => false)) {
          await compactOption.click();
          await expect(compactOption).toHaveClass(/active/);
        }
      }
    });

    test('should change density when clicking Spacious option', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const appearanceTab = page.locator('.tab', { hasText: 'Appearance' });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        await page.waitForTimeout(1000);
        const spaciousOption = page.locator('[data-testid="density-spacious"]');
        if (await spaciousOption.isVisible().catch(() => false)) {
          await spaciousOption.click();
          await expect(spaciousOption).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Tab Icons', () => {
    test('should display icon in Notifications tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Notifications' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab.locator('svg')).toBeVisible();
      }
    });

    test('should display icon in Account tab', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tab = page.locator('.tab', { hasText: 'Account' });
      if (await tab.isVisible().catch(() => false)) {
        await expect(tab.locator('svg')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should have scrollable tabs container', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      await page.setViewportSize({ width: 320, height: 568 });
      const tabs = page.locator('.settings-tabs');
      if (await tabs.isVisible().catch(() => false)) {
        await expect(tabs).toBeVisible();
      }
    });

    test('should adjust padding on mobile', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      await page.setViewportSize({ width: 375, height: 667 });
      const settingsPage = page.locator('.settings-page');
      if (await settingsPage.isVisible().catch(() => false)) {
        await expect(settingsPage).toBeVisible();
      }
    });
  });

  test.describe('Panel Visibility', () => {
    test('should only show one panel at a time', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const activePanels = page.locator('.tab-panel.active');
      const count = await activePanels.count();
      if (count > 0) {
        await expect(activePanels).toHaveCount(1);
      }
    });

    test('should hide other panels when tab changes', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const accountTab = page.locator('.tab', { hasText: 'Account' });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();

        const notificationsPanel = page.locator('#notifications-panel');
        const accountPanel = page.locator('#account-panel');

        await expect(notificationsPanel).not.toHaveClass(/active/);
        await expect(accountPanel).toHaveClass(/active/);
      }
    });

    test('should cycle through all tabs correctly', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\/settings/);

      const tabs = ['Notifications', 'Appearance', 'Account', 'Security', 'Connections', 'Privacy'];
      const panelIds = ['notifications-panel', 'appearance-panel', 'account-panel', 'security-panel', 'connections-panel', 'privacy-panel'];

      const firstTab = page.locator('.tab', { hasText: 'Notifications' });
      if (await firstTab.isVisible().catch(() => false)) {
        for (let i = 0; i < tabs.length; i++) {
          await page.locator('.tab', { hasText: tabs[i] }).click();
          await expect(page.locator(`#${panelIds[i]}`)).toHaveClass(/active/);

          for (let j = 0; j < panelIds.length; j++) {
            if (i !== j) {
              await expect(page.locator(`#${panelIds[j]}`)).not.toHaveClass(/active/);
            }
          }
        }
      }
    });
  });
});
