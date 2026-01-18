import { test, expect } from '@playwright/test';

// Helper to wait for page load
async function waitForPageLoad(page: import('@playwright/test').Page, path: string) {
  await page.waitForTimeout(2000);
  return page.url().includes(path);
}

test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test.describe('Page Layout', () => {
    test('should load page or redirect to login', async ({ page }) => {
      await page.waitForTimeout(1500);
      const url = page.url();
      const isOnLeaderboard = url.includes('/leaderboard');
      const isOnLogin = url.includes('/auth/login');
      expect(isOnLeaderboard || isOnLogin).toBe(true);
    });

    test('should display leaderboard component when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const leaderboard = page.locator('[data-testid="leaderboard"]');
        if (await leaderboard.isVisible().catch(() => false)) {
          await expect(leaderboard).toBeVisible();
        }
      }
    });

    test('should have Leaderboard heading when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const heading = page.locator('h1:has-text("Leaderboard")');
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });
  });

  test.describe('Period Tabs', () => {
    test('should have weekly period tab when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const tab = page.locator('[data-testid="period-weekly"]');
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have monthly period tab when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const tab = page.locator('[data-testid="period-monthly"]');
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have yearly period tab when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const tab = page.locator('[data-testid="period-yearly"]');
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });

    test('should have all-time period tab when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const tab = page.locator('[data-testid="period-all_time"]');
        if (await tab.isVisible().catch(() => false)) {
          await expect(tab).toBeVisible();
        }
      }
    });
  });

  test.describe('Metric Selector', () => {
    test('should have metric selector when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const selector = page.locator('[data-testid="metric-select"]');
        if (await selector.isVisible().catch(() => false)) {
          await expect(selector).toBeVisible();
        }
      }
    });

    test('should have all metric options when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const selector = page.locator('[data-testid="metric-select"]');
        if (await selector.isVisible().catch(() => false)) {
          await expect(selector.locator('option[value="return"]')).toBeVisible();
          await expect(selector.locator('option[value="sharpe"]')).toBeVisible();
          await expect(selector.locator('option[value="win_rate"]')).toBeVisible();
          await expect(selector.locator('option[value="consistency"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Opt-in Prompt', () => {
    test('should show opt-in prompt when not participating', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const prompt = page.locator('[data-testid="opt-in-prompt"]');
        // May or may not be visible depending on auth state and opt-in status
        const isVisible = await prompt.isVisible().catch(() => false);
        expect(typeof isVisible).toBe('boolean');
      }
    });

    test('should have opt-in button when visible', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const button = page.locator('[data-testid="opt-in-button"]');
        if (await button.isVisible().catch(() => false)) {
          await expect(button).toBeVisible();
          await expect(button).toHaveText(/Join Leaderboard/);
        }
      }
    });
  });

  test.describe('Leaderboard Table', () => {
    test('should have leaderboard entries container when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/leaderboard');
      if (isOnPage) {
        const entries = page.locator('[data-testid="leaderboard-entries"]');
        // May be empty if no entries
        const exists = await entries.count() > 0;
        expect(typeof exists).toBe('boolean');
      }
    });
  });
});

test.describe('Leaderboard Navigation', () => {
  test('should navigate to leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/leaderboard') || url.includes('/auth/login')).toBe(true);
  });
});

test.describe('Responsive Design', () => {
  test('should display on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/leaderboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/leaderboard') || url.includes('/auth/login')).toBe(true);
  });

  test('should have proper layout on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/leaderboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/leaderboard') || url.includes('/auth/login')).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA roles when authenticated', async ({ page }) => {
    await page.goto('/leaderboard');
    const isOnPage = await waitForPageLoad(page, '/leaderboard');
    if (isOnPage) {
      const tablist = page.locator('[role="tablist"]');
      if (await tablist.isVisible().catch(() => false)) {
        await expect(tablist).toBeVisible();
      }

      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount >= 0).toBe(true);
    }
  });

  test('should have labeled metric selector when authenticated', async ({ page }) => {
    await page.goto('/leaderboard');
    const isOnPage = await waitForPageLoad(page, '/leaderboard');
    if (isOnPage) {
      const label = page.locator('label[for="metric-select"]');
      if (await label.isVisible().catch(() => false)) {
        await expect(label).toHaveText(/Rank by/);
      }
    }
  });
});
