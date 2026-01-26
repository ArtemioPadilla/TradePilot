/**
 * Assertion Helpers for E2E Tests
 *
 * Provides reusable assertion functions for common validation patterns.
 */

import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Assert that a form field has a validation error
 */
export async function assertFieldHasError(page: Page, fieldSelector: string): Promise<void> {
  const field = page.locator(fieldSelector);
  const ariaInvalid = await field.getAttribute('aria-invalid');
  const hasErrorClass = await field.evaluate((el) =>
    el.classList.contains('error') || el.classList.contains('invalid')
  );

  expect(ariaInvalid === 'true' || hasErrorClass).toBeTruthy();
}

/**
 * Assert that a form field does not have a validation error
 */
export async function assertFieldNoError(page: Page, fieldSelector: string): Promise<void> {
  const field = page.locator(fieldSelector);
  const ariaInvalid = await field.getAttribute('aria-invalid');
  expect(ariaInvalid !== 'true').toBeTruthy();
}

/**
 * Assert that a success message is displayed
 */
export async function assertSuccessMessage(page: Page, message?: string): Promise<void> {
  const successSelector = '[role="status"], .success-message, .toast-success, [data-testid="success"]';
  const successElement = page.locator(successSelector).first();
  await expect(successElement).toBeVisible();

  if (message) {
    await expect(successElement).toContainText(message);
  }
}

/**
 * Assert that an error message is displayed
 */
export async function assertErrorMessage(page: Page, message?: string): Promise<void> {
  const errorSelector = '[role="alert"], .error-message, .toast-error, [data-testid="error"]';
  const errorElement = page.locator(errorSelector).first();
  await expect(errorElement).toBeVisible();

  if (message) {
    await expect(errorElement).toContainText(message);
  }
}

/**
 * Assert that a loading indicator is displayed
 */
export async function assertLoading(page: Page): Promise<void> {
  const loadingSelector = '.loading, .spinner, [data-loading="true"], [aria-busy="true"]';
  const loadingElement = page.locator(loadingSelector).first();
  await expect(loadingElement).toBeVisible();
}

/**
 * Assert that loading has finished
 */
export async function assertNotLoading(page: Page, timeout = 10000): Promise<void> {
  const loadingSelector = '.loading, .spinner, [data-loading="true"], [aria-busy="true"]';
  const loadingElement = page.locator(loadingSelector);
  await expect(loadingElement).toHaveCount(0, { timeout });
}

/**
 * Assert that a table contains expected number of rows
 */
export async function assertTableRowCount(
  page: Page,
  tableSelector: string,
  expectedCount: number
): Promise<void> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  await expect(rows).toHaveCount(expectedCount);
}

/**
 * Assert that a table contains at least one row
 */
export async function assertTableNotEmpty(page: Page, tableSelector: string): Promise<void> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * Assert that a modal is open
 */
export async function assertModalOpen(page: Page, modalSelector?: string): Promise<void> {
  const selector = modalSelector || '[role="dialog"], .modal, [data-testid="modal"]';
  const modal = page.locator(selector).first();
  await expect(modal).toBeVisible();
}

/**
 * Assert that a modal is closed
 */
export async function assertModalClosed(page: Page, modalSelector?: string): Promise<void> {
  const selector = modalSelector || '[role="dialog"], .modal, [data-testid="modal"]';
  const modal = page.locator(selector);
  await expect(modal).toHaveCount(0);
}

/**
 * Assert that a button is disabled
 */
export async function assertButtonDisabled(page: Page, buttonSelector: string): Promise<void> {
  const button = page.locator(buttonSelector);
  await expect(button).toBeDisabled();
}

/**
 * Assert that a button is enabled
 */
export async function assertButtonEnabled(page: Page, buttonSelector: string): Promise<void> {
  const button = page.locator(buttonSelector);
  await expect(button).toBeEnabled();
}

/**
 * Assert that text is visible on page
 */
export async function assertTextVisible(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Assert that text is not visible on page
 */
export async function assertTextNotVisible(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).not.toBeVisible();
}

/**
 * Assert element has specific attribute value
 */
export async function assertAttribute(
  locator: Locator,
  attribute: string,
  value: string
): Promise<void> {
  await expect(locator).toHaveAttribute(attribute, value);
}

/**
 * Assert element has specific CSS class
 */
export async function assertHasClass(locator: Locator, className: string): Promise<void> {
  await expect(locator).toHaveClass(new RegExp(className));
}

/**
 * Assert element does not have specific CSS class
 */
export async function assertNotHasClass(locator: Locator, className: string): Promise<void> {
  const classes = await locator.getAttribute('class');
  expect(classes).not.toContain(className);
}

/**
 * Assert input field has specific value
 */
export async function assertInputValue(page: Page, inputSelector: string, value: string): Promise<void> {
  const input = page.locator(inputSelector);
  await expect(input).toHaveValue(value);
}

/**
 * Assert checkbox is checked
 */
export async function assertChecked(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  await expect(checkbox).toBeChecked();
}

/**
 * Assert checkbox is not checked
 */
export async function assertNotChecked(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  await expect(checkbox).not.toBeChecked();
}

/**
 * Assert no console errors occurred (for critical paths)
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Give time for errors to appear
  await page.waitForTimeout(1000);

  expect(errors).toHaveLength(0);
}

/**
 * Assert network request was successful
 */
export async function assertRequestSuccess(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  const response = await page.waitForResponse(urlPattern);
  expect(response.status()).toBeLessThan(400);
}
