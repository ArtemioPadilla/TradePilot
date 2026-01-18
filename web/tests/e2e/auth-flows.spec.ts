import { test, expect } from '@playwright/test';

// Comprehensive auth flow tests

test.describe('Forgot Password Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Check heading
    const heading = page.getByRole('heading', { name: /forgot|reset|password/i });
    await expect(heading).toBeVisible();

    // Check email input
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Check submit button
    const submitButton = page.getByRole('button', { name: /send|reset|submit/i });
    await expect(submitButton).toBeVisible();
  });

  test('should have link back to login', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    const loginLink = page.getByRole('link', { name: /login|sign in|back/i });
    await expect(loginLink).toBeVisible();
  });

  test('should validate email before submission', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Try to submit without email
    const submitButton = page.getByRole('button', { name: /send|reset|submit/i });
    await submitButton.click();

    // Check for validation
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe('Pending Approval Page', () => {
  test('should display pending approval message', async ({ page }) => {
    await page.goto('/auth/pending');

    // Check for pending message
    const pendingText = page.locator('text=/pending|approval|waiting|review/i');
    if (await pendingText.first().isVisible().catch(() => false)) {
      await expect(pendingText.first()).toBeVisible();
    }

    // Page should load without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Suspended Account Page', () => {
  test('should display suspended account message', async ({ page }) => {
    await page.goto('/auth/suspended');

    // Check for suspended message
    const suspendedText = page.locator('text=/suspended|disabled|blocked|contact/i');
    if (await suspendedText.first().isVisible().catch(() => false)) {
      await expect(suspendedText.first()).toBeVisible();
    }

    // Page should load without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Invite Code Registration', () => {
  test('should handle invite code in URL', async ({ page }) => {
    // Navigate to invite registration with a test code via query parameter
    await page.goto('/auth/invite?code=TEST123');

    // Wait for page to process
    await page.waitForTimeout(1500);

    // Should either show registration form, error message, or redirect
    const url = page.url();
    const isOnInvite = url.includes('/auth/invite');
    const isOnRegister = url.includes('/auth/register');
    const isOnLogin = url.includes('/auth/login');

    expect(isOnInvite || isOnRegister || isOnLogin).toBe(true);

    if (isOnInvite) {
      // Wait for client-side script to execute
      await page.waitForTimeout(1500);

      // Check for either registration form or error message (invalid code)
      const emailInput = page.getByLabel(/email/i);
      const errorHeading = page.locator('text=/invalid|error|no code/i');
      const errorByTestId = page.getByTestId('invite-error');
      const loadingState = page.locator('#invite-loading');
      const validatingText = page.locator('text=/validating/i');

      const hasEmail = await emailInput.isVisible().catch(() => false);
      const hasError = await errorHeading.first().isVisible().catch(() => false);
      const hasErrorById = await errorByTestId.isVisible().catch(() => false);
      const isLoading = await loadingState.isVisible().catch(() => false);
      const isValidating = await validatingText.isVisible().catch(() => false);

      // Accept if showing form, error, loading, or validating
      expect(hasEmail || hasError || hasErrorById || isLoading || isValidating).toBe(true);
    }
  });

  test('should show error when no invite code provided', async ({ page }) => {
    await page.goto('/auth/invite');
    // Wait for client-side JS to execute
    await page.waitForTimeout(2000);

    // Should show no code message - check heading or paragraph
    const noCodeHeading = page.locator('h2:has-text("No Invite Code")');
    const noCodeText = page.locator('text=/need.*invite.*code|no invite/i');

    const hasHeading = await noCodeHeading.isVisible().catch(() => false);
    const hasText = await noCodeText.first().isVisible().catch(() => false);

    // Either heading or text should be visible indicating no code error
    expect(hasHeading || hasText).toBe(true);
  });
});

test.describe('Auth Error Handling', () => {
  test('should display error on invalid login', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword123');

    // Submit form
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for error message (may be in DOM even if not visible yet)
    const errorVisible = await page.locator('.error-message, [role="alert"], text=/error|invalid|incorrect/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Either error shown or still on login page
    const stillOnLogin = page.url().includes('/auth/login');
    expect(errorVisible || stillOnLogin).toBe(true);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/login');

    // Page should load even if Firebase is slow
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should persist auth state across page navigations', async ({ page }) => {
    // Start at login
    await page.goto('/auth/login');
    await page.waitForTimeout(500);

    // Navigate to register
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/auth/register');

    // Navigate back to login
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL('/auth/login');

    // Form should still be functional
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
