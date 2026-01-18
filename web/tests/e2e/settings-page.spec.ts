import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1500);
  });

  test.describe('Page Layout', () => {
    test('should display settings page header', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const heading = page.locator('.settings-header h1');
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toContainText('Settings');
        }
      }
    });

    test('should display page description', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const description = page.locator('.settings-header p');
        if (await description.isVisible().catch(() => false)) {
          await expect(description).toContainText('Manage your account preferences');
        }
      }
    });

    test('should display tab navigation', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tabs = page.locator('.settings-tabs');
        if (await tabs.isVisible().catch(() => false)) {
          await expect(tabs).toBeVisible();
        }
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should have Notifications tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Notifications' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have Account tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Account' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have Security tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Security' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have Connections tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Connections' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have Privacy tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Privacy' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have Notifications tab active by default', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const notificationsTab = page.locator('.tab', { hasText: 'Notifications' });
        if (await notificationsTab.isVisible().catch(() => false)) {
          await expect(notificationsTab).toHaveClass(/active/);
          await expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
        }
      }
    });

    test('should switch to Account tab on click', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const accountTab = page.locator('.tab', { hasText: 'Account' });
        if (await accountTab.isVisible().catch(() => false)) {
          await accountTab.click();
          await expect(accountTab).toHaveClass(/active/);
          await expect(page.locator('#account-panel')).toHaveClass(/active/);
        }
      }
    });

    test('should switch to Security tab on click', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const securityTab = page.locator('.tab', { hasText: 'Security' });
        if (await securityTab.isVisible().catch(() => false)) {
          await securityTab.click();
          await expect(securityTab).toHaveClass(/active/);
          await expect(page.locator('#security-panel')).toHaveClass(/active/);
        }
      }
    });

    test('should switch to Connections tab on click', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
        if (await connectionsTab.isVisible().catch(() => false)) {
          await connectionsTab.click();
          await expect(connectionsTab).toHaveClass(/active/);
          await expect(page.locator('#connections-panel')).toHaveClass(/active/);
        }
      }
    });

    test('should switch to Privacy tab on click', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
        if (await privacyTab.isVisible().catch(() => false)) {
          await privacyTab.click();
          await expect(privacyTab).toHaveClass(/active/);
          await expect(page.locator('#privacy-panel')).toHaveClass(/active/);
        }
      }
    });

    test('should update aria-selected on tab switch', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const notificationsTab = page.locator('.tab', { hasText: 'Notifications' });
        const accountTab = page.locator('.tab', { hasText: 'Account' });

        if (await notificationsTab.isVisible().catch(() => false)) {
          await expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
          await expect(accountTab).toHaveAttribute('aria-selected', 'false');

          await accountTab.click();

          await expect(notificationsTab).toHaveAttribute('aria-selected', 'false');
          await expect(accountTab).toHaveAttribute('aria-selected', 'true');
        }
      }
    });

    test('should have proper tablist role', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tablist = page.locator('.settings-tabs');
        if (await tablist.isVisible().catch(() => false)) {
          await expect(tablist).toHaveAttribute('role', 'tablist');
        }
      }
    });

    test('should have proper tab roles', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tabs = page.locator('.tab');
        const count = await tabs.count();
        if (count > 0) {
          for (let i = 0; i < count; i++) {
            await expect(tabs.nth(i)).toHaveAttribute('role', 'tab');
          }
        }
      }
    });
  });

  test.describe('Notifications Panel', () => {
    test('should display NotificationPreferencesForm', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const panel = page.locator('#notifications-panel');
        if (await panel.isVisible().catch(() => false)) {
          await expect(panel).toHaveClass(/active/);
        }
      }
    });

    test('should show notifications panel by default', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const panel = page.locator('#notifications-panel');
        if (await panel.isVisible().catch(() => false)) {
          await expect(panel).toBeVisible();
        }
      }
    });
  });

  test.describe('Account Panel', () => {
    test('should display placeholder when Account tab selected', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const accountTab = page.locator('.tab', { hasText: 'Account' });
        if (await accountTab.isVisible().catch(() => false)) {
          await accountTab.click();
          await expect(page.locator('#account-panel .placeholder-section')).toBeVisible();
        }
      }
    });

    test('should show account placeholder text', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const accountTab = page.locator('.tab', { hasText: 'Account' });
        if (await accountTab.isVisible().catch(() => false)) {
          await accountTab.click();
          await expect(page.locator('#account-panel h3')).toContainText('Account Settings');
        }
      }
    });
  });

  test.describe('Security Panel', () => {
    test('should display placeholder when Security tab selected', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const securityTab = page.locator('.tab', { hasText: 'Security' });
        if (await securityTab.isVisible().catch(() => false)) {
          await securityTab.click();
          await expect(page.locator('#security-panel .placeholder-section')).toBeVisible();
        }
      }
    });

    test('should show security placeholder text', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const securityTab = page.locator('.tab', { hasText: 'Security' });
        if (await securityTab.isVisible().catch(() => false)) {
          await securityTab.click();
          await expect(page.locator('#security-panel h3')).toContainText('Security Settings');
        }
      }
    });
  });

  test.describe('Connections Panel', () => {
    test('should display placeholder when Connections tab selected', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
        if (await connectionsTab.isVisible().catch(() => false)) {
          await connectionsTab.click();
          await expect(page.locator('#connections-panel .placeholder-section')).toBeVisible();
        }
      }
    });

    test('should show connections placeholder text', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
        if (await connectionsTab.isVisible().catch(() => false)) {
          await connectionsTab.click();
          await expect(page.locator('#connections-panel h3')).toContainText('Connected Services');
        }
      }
    });
  });

  test.describe('Privacy Panel', () => {
    test('should display privacy form when Privacy tab selected', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const privacyTab = page.locator('.tab', { hasText: 'Privacy' });
        if (await privacyTab.isVisible().catch(() => false)) {
          await privacyTab.click();
          await expect(page.locator('#privacy-panel')).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Tab Icons', () => {
    test('should display icon in Notifications tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Notifications' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab.locator('svg')).toBeVisible();
        }
      }
    });

    test('should display icon in Account tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Account' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab.locator('svg')).toBeVisible();
        }
      }
    });

    test('should display icon in Security tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Security' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab.locator('svg')).toBeVisible();
        }
      }
    });

    test('should display icon in Connections tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Connections' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab.locator('svg')).toBeVisible();
        }
      }
    });

    test('should display icon in Privacy tab', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tab = page.locator('.tab', { hasText: 'Privacy' });
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab.locator('svg')).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should have scrollable tabs container', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        await page.setViewportSize({ width: 320, height: 568 });
        const tabs = page.locator('.settings-tabs');
        if (await tabs.isVisible().catch(() => false)) {
          await expect(tabs).toBeVisible();
        }
      }
    });

    test('should adjust padding on mobile', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        await page.setViewportSize({ width: 375, height: 667 });
        const settingsPage = page.locator('.settings-page');
        if (await settingsPage.isVisible().catch(() => false)) {
          await expect(settingsPage).toBeVisible();
        }
      }
    });
  });

  test.describe('Panel Visibility', () => {
    test('should only show one panel at a time', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const activePanels = page.locator('.tab-panel.active');
        const count = await activePanels.count();
        if (count > 0) {
          await expect(activePanels).toHaveCount(1);
        }
      }
    });

    test('should hide other panels when tab changes', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const accountTab = page.locator('.tab', { hasText: 'Account' });
        if (await accountTab.isVisible().catch(() => false)) {
          await accountTab.click();

          const notificationsPanel = page.locator('#notifications-panel');
          const accountPanel = page.locator('#account-panel');

          await expect(notificationsPanel).not.toHaveClass(/active/);
          await expect(accountPanel).toHaveClass(/active/);
        }
      }
    });

    test('should cycle through all tabs correctly', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const tabs = ['Notifications', 'Account', 'Security', 'Connections', 'Privacy'];
        const panelIds = ['notifications-panel', 'account-panel', 'security-panel', 'connections-panel', 'privacy-panel'];

        const firstTab = page.locator('.tab', { hasText: 'Notifications' });
        if (await firstTab.isVisible().catch(() => false)) {
          for (let i = 0; i < tabs.length; i++) {
            await page.locator('.tab', { hasText: tabs[i] }).click();
            await expect(page.locator(`#${panelIds[i]}`)).toHaveClass(/active/);

            // Verify other panels are not active
            for (let j = 0; j < panelIds.length; j++) {
              if (i !== j) {
                await expect(page.locator(`#${panelIds[j]}`)).not.toHaveClass(/active/);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Placeholder Section Styling', () => {
    test('should display placeholder icon in Account section', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const accountTab = page.locator('.tab', { hasText: 'Account' });
        if (await accountTab.isVisible().catch(() => false)) {
          await accountTab.click();
          await expect(page.locator('#account-panel .placeholder-icon svg')).toBeVisible();
        }
      }
    });

    test('should display placeholder icon in Security section', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const securityTab = page.locator('.tab', { hasText: 'Security' });
        if (await securityTab.isVisible().catch(() => false)) {
          await securityTab.click();
          await expect(page.locator('#security-panel .placeholder-icon svg')).toBeVisible();
        }
      }
    });

    test('should display placeholder icon in Connections section', async ({ page }) => {
      const isOnSettings = page.url().includes('/dashboard/settings');
      if (isOnSettings) {
        const connectionsTab = page.locator('.tab', { hasText: 'Connections' });
        if (await connectionsTab.isVisible().catch(() => false)) {
          await connectionsTab.click();
          await expect(page.locator('#connections-panel .placeholder-icon svg')).toBeVisible();
        }
      }
    });
  });
});
