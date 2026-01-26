/**
 * Login Flow User Journey
 *
 * Tests the complete login flow for authenticated users.
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../_shared';

test.describe('Journey: Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageReady(page);
  });

  test('should display login form with all elements', async ({ page }) => {
    // Verify heading
    const heading = page.getByRole('heading', { name: /log in|sign in|welcome/i });
    await expect(heading).toBeVisible();

    // Verify email input
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Verify password input
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Verify submit button
    const submitButton = page.getByRole('button', { name: /log in/i });
    await expect(submitButton).toBeVisible();

    // Verify forgot password link
    const forgotLink = page.locator('a[href*="forgot"]');
    await expect(forgotLink).toBeVisible();

    // Verify sign up link
    const signupLink = page.locator('a[href*="register"]');
    await expect(signupLink).toBeVisible();
  });

  test('should validate empty email field', async ({ page }) => {
    // Leave email empty, fill password
    await page.locator('#password').fill('TestPassword123!');

    // Try to submit
    await page.getByRole('button', { name: /log in/i }).click();

    // Should show validation error
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('should validate empty password field', async ({ page }) => {
    // Fill email, leave password empty
    await page.locator('#email').fill('test@example.com');

    // Try to submit
    await page.getByRole('button', { name: /log in/i }).click();

    // Should show validation error
    const passwordInput = page.locator('#password');
    const isInvalid = await passwordInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.locator('#email').fill('invalid@nonexistent.com');
    await page.locator('#password').fill('wrongpassword123');

    // Submit
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Should stay on login page or show error
    const url = page.url();
    const hasError = await page
      .locator('.error-message, [role="alert"], text=/error|invalid|incorrect/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(url.includes('/auth/login') || hasError).toBe(true);
  });

  test('should toggle password visibility', async ({ page }) => {
    // Find toggle button
    const toggleButton = page.locator(
      'button[aria-label*="password"], [data-testid="toggle-password"]'
    );

    if (await toggleButton.isVisible().catch(() => false)) {
      // Initial state: password hidden
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Password should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"]');
    await forgotLink.click();

    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should navigate to registration page', async ({ page }) => {
    const signupLink = page.locator('a[href*="register"]');
    await signupLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    // Fill credentials
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);

    // Submit
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for redirect
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    // Verify authenticated state
    await expect(page).toHaveURL(/dashboard/);
  });
});
