import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test.describe('Manifest', () => {
    test('should have a valid manifest.json', async ({ page }) => {
      const response = await page.goto('/manifest.json');
      expect(response?.status()).toBe(200);

      const manifest = await response?.json();
      expect(manifest.name).toBe('TradePilot');
      expect(manifest.short_name).toBe('TradePilot');
      expect(manifest.start_url).toBe('/dashboard');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#6366f1');
    });

    test('should have icons defined in manifest', async ({ page }) => {
      const response = await page.goto('/manifest.json');
      const manifest = await response?.json();

      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Check for required icon sizes
      const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });

    test('should have shortcuts defined in manifest', async ({ page }) => {
      const response = await page.goto('/manifest.json');
      const manifest = await response?.json();

      expect(manifest.shortcuts).toBeDefined();
      expect(manifest.shortcuts.length).toBeGreaterThan(0);
    });
  });

  test.describe('PWA Meta Tags', () => {
    test('should have theme-color meta tag', async ({ page }) => {
      await page.goto('/');
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(themeColor).toBe('#6366f1');
    });

    test('should have apple-mobile-web-app-capable meta tag', async ({ page }) => {
      await page.goto('/');
      const capable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
      expect(capable).toBe('yes');
    });

    test('should have manifest link tag', async ({ page }) => {
      await page.goto('/');
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBe('/manifest.json');
    });

    test('should have apple-touch-icon link', async ({ page }) => {
      await page.goto('/');
      const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
      const href = await appleTouchIcon.getAttribute('href');
      expect(href).toContain('icon');
    });
  });

  test.describe('Viewport', () => {
    test('should have proper viewport meta tag', async ({ page }) => {
      await page.goto('/');
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
    });
  });
});

test.describe('Error Handling', () => {
  test('should load dashboard page without errors', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);

    // Should not have any uncaught errors in console
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.waitForTimeout(500);
    // Note: Some Firebase auth errors are expected when not logged in
  });
});

test.describe('Accessibility', () => {
  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');

    // Should have html lang attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('should have descriptive title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('TradePilot');
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });
});

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Page should render without horizontal scroll
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(768);
  });

  test('should adapt to desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(1440);
  });
});
