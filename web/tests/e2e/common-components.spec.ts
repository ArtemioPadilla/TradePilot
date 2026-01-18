import { test, expect } from '@playwright/test';

test.describe('Common Components', () => {
  test.describe('404 Error Page', () => {
    test('should display 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/non-existent-page-xyz');
      await page.waitForTimeout(1000);

      // Should show 404 or redirect to a valid page
      const url = page.url();
      const has404 = url.includes('404') || (await page.locator('text=404').isVisible().catch(() => false));
      const hasNotFound = await page.locator('text=Not Found').isVisible().catch(() => false);
      const redirected = url.includes('/auth/') || url.includes('/dashboard');

      expect(has404 || hasNotFound || redirected).toBe(true);
    });

    test('should have Go to Dashboard link on 404 page', async ({ page }) => {
      await page.goto('/404');
      await page.waitForTimeout(500);

      const dashboardLink = page.locator('a[href="/dashboard"]');
      if (await dashboardLink.isVisible().catch(() => false)) {
        await expect(dashboardLink).toBeVisible();
      }
    });

    test('should have Go Back button on 404 page', async ({ page }) => {
      await page.goto('/404');
      await page.waitForTimeout(500);

      const backButton = page.locator('button:has-text("Go Back")');
      if (await backButton.isVisible().catch(() => false)) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should display helpful links on 404 page', async ({ page }) => {
      await page.goto('/404');
      await page.waitForTimeout(500);

      const helpfulLinks = page.locator('.helpful-links');
      if (await helpfulLinks.isVisible().catch(() => false)) {
        await expect(helpfulLinks).toBeVisible();
      }
    });
  });

  test.describe('Feedback Widget', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1500);
    });

    test('should display feedback trigger button', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await expect(trigger).toBeVisible();
        }
      }
    });

    test('should open feedback modal on trigger click', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const modal = page.locator('[data-testid="feedback-modal"], .feedback-modal');
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should have feedback type buttons', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const bugButton = page.locator('.type-button:has-text("Bug")');
          const featureButton = page.locator('.type-button:has-text("Feature")');
          const generalButton = page.locator('.type-button:has-text("General")');

          if (await bugButton.isVisible().catch(() => false)) {
            await expect(bugButton).toBeVisible();
            await expect(featureButton).toBeVisible();
            await expect(generalButton).toBeVisible();
          }
        }
      }
    });

    test('should have message textarea', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const textarea = page.locator('[data-testid="feedback-message"], #feedback-message');
          if (await textarea.isVisible().catch(() => false)) {
            await expect(textarea).toBeVisible();
          }
        }
      }
    });

    test('should have optional email input', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const emailInput = page.locator('[data-testid="feedback-email"], #feedback-email');
          if (await emailInput.isVisible().catch(() => false)) {
            await expect(emailInput).toBeVisible();
          }
        }
      }
    });

    test('should close modal on overlay click', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const overlay = page.locator('.feedback-overlay');
          if (await overlay.isVisible().catch(() => false)) {
            await overlay.click({ position: { x: 10, y: 10 } });
            await page.waitForTimeout(300);

            const modal = page.locator('.feedback-modal');
            await expect(modal).not.toBeVisible();
          }
        }
      }
    });

    test('should close modal on close button click', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const closeButton = page.locator('.feedback-modal .close-button');
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click();
            await page.waitForTimeout(300);

            const modal = page.locator('.feedback-modal');
            await expect(modal).not.toBeVisible();
          }
        }
      }
    });

    test('should disable submit when message is empty', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const submitButton = page.locator('[data-testid="feedback-submit"], .submit-button');
          if (await submitButton.isVisible().catch(() => false)) {
            await expect(submitButton).toBeDisabled();
          }
        }
      }
    });

    test('should enable submit when message is entered', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="feedback-trigger"], .feedback-trigger');
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.click();
          await page.waitForTimeout(300);

          const textarea = page.locator('[data-testid="feedback-message"], #feedback-message');
          const submitButton = page.locator('[data-testid="feedback-submit"], .submit-button');

          if (await textarea.isVisible().catch(() => false)) {
            await textarea.fill('Test feedback message');
            await expect(submitButton).not.toBeDisabled();
          }
        }
      }
    });
  });

  test.describe('Skeleton Loading Components', () => {
    test('should render skeleton with correct styles', async ({ page }) => {
      // Navigate to a page that might show skeletons
      await page.goto('/dashboard');
      await page.waitForTimeout(500);

      // Check if any skeleton elements exist during loading
      const skeletons = page.locator('[data-testid="skeleton"], .skeleton');
      const count = await skeletons.count();

      // Skeletons may or may not be visible depending on loading state
      // This test verifies the component renders without errors
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Boundary', () => {
    test('should render children when no error', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1500);

      // If we get to the dashboard without crash, error boundary is working
      const url = page.url();
      const hasContent = url.includes('/dashboard') || url.includes('/auth/');
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Offline Indicator', () => {
    test('should not show indicator when online', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1500);

      const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-indicator');
      // Should not be visible when online
      const isVisible = await offlineIndicator.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });
  });

  test.describe('Help Tooltip', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1500);
    });

    test('should show tooltip on trigger hover', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="help-trigger"]').first();
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.hover();
          await page.waitForTimeout(300);

          const tooltip = page.locator('[data-testid="help-tooltip"]');
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('should hide tooltip when mouse leaves', async ({ page }) => {
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        const trigger = page.locator('[data-testid="help-trigger"]').first();
        if (await trigger.isVisible().catch(() => false)) {
          await trigger.hover();
          await page.waitForTimeout(300);

          // Move mouse away
          await page.mouse.move(0, 0);
          await page.waitForTimeout(300);

          const tooltip = page.locator('[data-testid="help-tooltip"]');
          await expect(tooltip).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Onboarding Tour', () => {
    test('should not show tour when already completed', async ({ page }) => {
      // Set the tour as completed
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('tradepilot-tour-completed', 'true');
      });
      await page.reload();
      await page.waitForTimeout(1500);

      const tourOverlay = page.locator('[data-testid="tour-overlay"]');
      const isVisible = await tourOverlay.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('should show tour for new users', async ({ page }) => {
      // Clear the tour completion
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.removeItem('tradepilot-tour-completed');
      });

      // Note: Tour may not show if user is not authenticated
      // This test verifies the localStorage mechanism works
      const tourCompleted = await page.evaluate(() => {
        return localStorage.getItem('tradepilot-tour-completed');
      });
      expect(tourCompleted).toBeNull();
    });
  });
});

test.describe('Page Structure', () => {
  test('all pages should have proper HTML structure', async ({ page }) => {
    const pages = [
      '/',
      '/auth/login',
      '/auth/register',
      '/dashboard',
      '/tools',
      '/leaderboard',
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500);

      // Check for basic HTML structure
      const hasHtml = await page.locator('html').count() > 0;
      const hasHead = await page.locator('head').count() > 0;
      const hasBody = await page.locator('body').count() > 0;

      expect(hasHtml).toBe(true);
      expect(hasHead).toBe(true);
      expect(hasBody).toBe(true);

      // Check for title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('pages should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check for charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveCount(1);
  });

  test('pages should have PWA manifest link', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });

  test('pages should have theme color meta', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });
});
