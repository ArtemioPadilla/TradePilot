import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page correctly', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.getByRole('heading', { name: /unified trading/i })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /log in/i }).click();

    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/tradepilot/i);

    // Check viewport meta
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check images have alt text (if any exist)
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Theme Switcher', () => {
  test('should switch themes', async ({ page }) => {
    await page.goto('/');

    // Find theme switcher
    const themeSwitcher = page.locator('[data-testid="theme-switcher"], select');

    if (await themeSwitcher.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('data-theme');

      // Switch theme
      await themeSwitcher.selectOption({ index: 1 });

      // Check theme changed
      const newTheme = await htmlElement.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should persist theme preference', async ({ page, context }) => {
    await page.goto('/');

    // Set theme via localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme', 'bloomberg');
    });

    // Reload and check
    await page.reload();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'bloomberg');
  });
});
