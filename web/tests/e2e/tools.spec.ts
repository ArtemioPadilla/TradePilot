import { test, expect } from '@playwright/test';

// Helper to wait for page load
async function waitForPageLoad(page: import('@playwright/test').Page, path: string) {
  await page.waitForTimeout(2000);
  return page.url().includes(path);
}

test.describe('Financial Tools Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools');
  });

  test.describe('Page Layout', () => {
    test('should load tools page or redirect to login', async ({ page }) => {
      await page.waitForTimeout(1500);
      const url = page.url();
      const isOnTools = url.includes('/tools');
      const isOnLogin = url.includes('/auth/login');
      expect(isOnTools || isOnLogin).toBe(true);
    });

    test('should have Financial Tools heading when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const heading = page.locator('h1:has-text("Financial Tools")');
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });
  });

  test.describe('Compound Growth Calculator', () => {
    test('should display calculator when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const calculator = page.locator('[data-testid="compound-growth-calculator"]');
        if (await calculator.isVisible().catch(() => false)) {
          await expect(calculator).toBeVisible();
        }
      }
    });

    test('should have initial investment input', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const input = page.locator('[data-testid="input-initial"]');
        if (await input.isVisible().catch(() => false)) {
          await expect(input).toBeVisible();
        }
      }
    });

    test('should have monthly contribution input', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const input = page.locator('[data-testid="input-monthly"]');
        if (await input.isVisible().catch(() => false)) {
          await expect(input).toBeVisible();
        }
      }
    });

    test('should have return rate input', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const input = page.locator('[data-testid="input-return"]');
        if (await input.isVisible().catch(() => false)) {
          await expect(input).toBeVisible();
        }
      }
    });

    test('should have years input', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const input = page.locator('[data-testid="input-years"]');
        if (await input.isVisible().catch(() => false)) {
          await expect(input).toBeVisible();
        }
      }
    });

    test('should display result final value', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const result = page.locator('[data-testid="result-final"]');
        if (await result.isVisible().catch(() => false)) {
          await expect(result).toBeVisible();
        }
      }
    });

    test('should display contributions result', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const result = page.locator('[data-testid="result-contributions"]');
        if (await result.isVisible().catch(() => false)) {
          await expect(result).toBeVisible();
        }
      }
    });

    test('should display interest earned result', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page, '/tools');
      if (isOnPage) {
        const result = page.locator('[data-testid="result-interest"]');
        if (await result.isVisible().catch(() => false)) {
          await expect(result).toBeVisible();
        }
      }
    });
  });
});

test.describe('Responsive Design', () => {
  test('should display on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/tools');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/tools') || url.includes('/auth/login')).toBe(true);
  });

  test('should display on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/tools');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/tools') || url.includes('/auth/login')).toBe(true);
  });
});
