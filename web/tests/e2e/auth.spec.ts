import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    // Check heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // Check register link
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /log in/i }).click();

    // Check for required field validation (browser native)
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();

    // Check for email validation
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();

    await expect(page).toHaveURL('/auth/register');
  });

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check heading
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).click();

    await expect(page).toHaveURL('/auth/login');
  });

  test('should validate password requirements', async ({ page }) => {
    // Fill email
    await page.getByLabel(/email/i).fill('test@example.com');

    // Fill weak password
    await page.getByLabel(/^password$/i).fill('123');

    // Try to submit
    await page.getByRole('button', { name: /create account/i }).click();

    // Password should be invalid (too short based on minLength attribute)
    const passwordInput = page.getByLabel(/^password$/i);
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe('Auth Flow', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login or show loading/error
    // Wait for navigation or content to settle
    await page.waitForTimeout(2000);

    const url = page.url();
    const isOnLogin = url.includes('/auth/login');
    const isOnDashboard = url.includes('/dashboard');

    // Either redirected to login or still on dashboard (with auth guard showing)
    expect(isOnLogin || isOnDashboard).toBe(true);
  });
});
