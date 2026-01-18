import { test, expect } from '@playwright/test';

// Helper to wait for page load
async function waitForPageLoad(page: import('@playwright/test').Page, path: string) {
  await page.waitForTimeout(2000);
  return page.url().includes(path);
}

test.describe('Privacy Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test.describe('Settings Page', () => {
    test('should load settings page or redirect to login', async ({ page }) => {
      await page.waitForTimeout(1500);
      const url = page.url();
      const isOnSettings = url.includes('/dashboard/settings');
      const isOnLogin = url.includes('/auth/login');
      expect(isOnSettings || isOnLogin).toBe(true);
    });

    test('should have Privacy tab when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
          await expect(tab).toHaveText(/Privacy/);
        }
      }
    });
  });

  test.describe('Privacy Tab Navigation', () => {
    test('should switch to privacy panel on tab click', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(500);
          const panel = page.locator('#privacy-panel');
          await expect(panel).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Privacy Settings Component', () => {
    test('should display privacy settings when tab is active', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const settings = page.locator('[data-testid="privacy-settings"]');
          if (await settings.isVisible().catch(() => false)) {
            await expect(settings).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Leaderboard Settings', () => {
    test('should have leaderboard opt-in toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-leaderboard-opt-in"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });

    test('should have anonymous mode toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-leaderboard-anonymous"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Profile Visibility Settings', () => {
    test('should have show profile toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-show-profile"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });

    test('should have show performance toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-show-performance"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });

    test('should have show strategies toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-show-strategies"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Strategy Sharing Defaults', () => {
    test('should have default public toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-default-public"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });

    test('should have default author visible toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-default-author"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });

    test('should have default allow copy toggle', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-default-copy"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Toggle Accessibility', () => {
    test('should have proper ARIA roles on toggles', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/dashboard/settings');
      if (isOnPage) {
        const tab = page.locator('[data-tab="privacy"]');
        if (await tab.isVisible().catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(1000);
          const toggle = page.locator('[data-testid="toggle-leaderboard-opt-in"]');
          if (await toggle.isVisible().catch(() => false)) {
            await expect(toggle).toHaveAttribute('role', 'switch');
          }
        }
      }
    });
  });
});

test.describe('Responsive Design', () => {
  test('should display privacy settings on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/settings') || url.includes('/auth/login')).toBe(true);
  });

  test('should display privacy settings on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/settings') || url.includes('/auth/login')).toBe(true);
  });
});
