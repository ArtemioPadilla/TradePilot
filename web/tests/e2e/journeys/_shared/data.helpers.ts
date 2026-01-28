/**
 * Data Helpers for E2E Tests
 *
 * Provides reusable functions for test data management:
 * - Creating and deleting test accounts
 * - Adding and managing test positions
 * - Cleaning up test data after tests
 */

import { type Page, expect } from '@playwright/test';
import { waitForPageReady } from './navigation.helpers';

/**
 * Generate a unique test identifier to avoid conflicts between parallel tests
 */
export function generateTestId(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create a test account with the given name
 * Returns the account name for later cleanup
 */
export async function createTestAccount(
  page: Page,
  options: {
    name?: string;
    type?: 'brokerage' | '401k' | 'ira' | 'roth_ira' | 'crypto' | 'bank' | 'other';
    currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF';
    institution?: string;
    cashBalance?: number;
    isDefault?: boolean;
  } = {}
): Promise<string> {
  const accountName = options.name || `Test Account ${generateTestId()}`;

  // Navigate to accounts page if not already there
  if (!page.url().includes('/dashboard/accounts')) {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);
  }

  // Click add account button
  const addButton = page.getByTestId('add-account-btn').or(
    page.getByRole('button', { name: /add.*account|new.*account/i })
  );
  await addButton.click();

  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

  // Fill account name
  const nameInput = page.locator('#name').or(page.getByLabel(/name/i));
  await nameInput.fill(accountName);

  // Select account type if specified
  if (options.type) {
    const typeSelect = page.locator('#type').or(page.getByLabel(/type/i));
    await typeSelect.selectOption(options.type);
  }

  // Select currency if specified
  if (options.currency) {
    const currencySelect = page.locator('#currency').or(page.getByLabel(/currency/i));
    await currencySelect.selectOption(options.currency);
  }

  // Fill institution if specified
  if (options.institution) {
    const institutionInput = page.locator('#institution').or(page.getByLabel(/institution/i));
    await institutionInput.fill(options.institution);
  }

  // Fill cash balance if specified
  if (options.cashBalance !== undefined) {
    const cashInput = page.locator('#cashBalance').or(page.getByLabel(/cash|balance/i));
    await cashInput.fill(options.cashBalance.toString());
  }

  // Set as default if specified
  if (options.isDefault) {
    const defaultCheckbox = page.locator('[name="isDefault"]').or(
      page.getByLabel(/default/i)
    );
    await defaultCheckbox.check();
  }

  // Submit the form
  const submitButton = page.getByRole('button', { name: /create.*account/i });
  await submitButton.click();

  // Wait for modal to close (success)
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });

  // Wait for the account to appear in the list
  await page.waitForTimeout(500);

  return accountName;
}

/**
 * Delete a test account by name
 */
export async function deleteTestAccount(page: Page, accountName: string): Promise<void> {
  // Navigate to accounts page if not already there
  if (!page.url().includes('/dashboard/accounts')) {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);
  }

  // Find the account card or row
  const accountElement = page.locator(`text="${accountName}"`).first();

  if (!(await accountElement.isVisible().catch(() => false))) {
    // Account doesn't exist, nothing to delete
    return;
  }

  // Click on the account to go to detail page
  await accountElement.click();
  await waitForPageReady(page);

  // Look for delete/remove button or menu
  const deleteButton = page.getByRole('button', { name: /delete|remove/i }).or(
    page.getByTestId('delete-account-btn')
  );

  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();

    // Handle confirmation modal if it appears
    const confirmModal = page.locator('[role="dialog"]');
    if (await confirmModal.isVisible().catch(() => false)) {
      // Look for confirmation input (type account name)
      const confirmInput = page.getByPlaceholder(/type.*name|confirm/i).or(
        page.locator('input[type="text"]').last()
      );
      if (await confirmInput.isVisible().catch(() => false)) {
        await confirmInput.fill(accountName);
      }

      // Click confirm delete button
      const confirmButton = page.getByRole('button', { name: /confirm|delete/i }).last();
      await confirmButton.click();

      // Wait for modal to close
      await expect(confirmModal).toBeHidden({ timeout: 10000 });
    }
  }
}

/**
 * Add a test position/holding to an account
 */
export async function addTestPosition(
  page: Page,
  options: {
    symbol: string;
    quantity: number;
    costBasis?: number;
    accountName?: string;
  }
): Promise<void> {
  // If account name specified, navigate to that account first
  if (options.accountName) {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);

    const accountLink = page.locator(`text="${options.accountName}"`).first();
    await accountLink.click();
    await waitForPageReady(page);
  }

  // Click add position/holding button
  const addButton = page.getByRole('button', { name: /add.*position|add.*holding|new.*position/i }).or(
    page.getByTestId('add-position-btn')
  );
  await addButton.click();

  // Wait for modal/form
  await page.waitForTimeout(300);

  // Fill symbol
  const symbolInput = page.getByLabel(/symbol|ticker/i).or(
    page.locator('input[name="symbol"]')
  );
  await symbolInput.fill(options.symbol.toUpperCase());

  // Fill quantity
  const quantityInput = page.getByLabel(/quantity|shares|amount/i).or(
    page.locator('input[name="quantity"]')
  );
  await quantityInput.fill(options.quantity.toString());

  // Fill cost basis if specified
  if (options.costBasis !== undefined) {
    const costInput = page.getByLabel(/cost|price|basis/i).or(
      page.locator('input[name="costBasis"]')
    );
    await costInput.fill(options.costBasis.toString());
  }

  // Submit
  const submitButton = page.getByRole('button', { name: /add|create|save/i }).last();
  await submitButton.click();

  // Wait for modal to close
  await page.waitForTimeout(500);
}

/**
 * Delete a test position/holding
 */
export async function deleteTestPosition(page: Page, symbol: string): Promise<void> {
  // Find the position row
  const positionRow = page.locator(`tr:has-text("${symbol}"), [data-symbol="${symbol}"]`).first();

  if (!(await positionRow.isVisible().catch(() => false))) {
    return;
  }

  // Click delete button in the row
  const deleteButton = positionRow.locator('button').filter({ hasText: /delete|remove|close/i }).or(
    positionRow.getByRole('button', { name: /delete|remove|close/i })
  );

  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();

    // Handle confirmation if needed
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await page.waitForTimeout(500);
  }
}

/**
 * Cleanup all test data created during test
 * Deletes accounts that match the test pattern
 */
export async function cleanupTestData(page: Page, testPattern?: string): Promise<void> {
  const pattern = testPattern || 'e2e-';

  try {
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);

    // Find all accounts matching the pattern
    const testAccounts = page.locator(`text=/${pattern}/`);
    const count = await testAccounts.count();

    for (let i = 0; i < count; i++) {
      const accountText = await testAccounts.nth(0).textContent();
      if (accountText) {
        await deleteTestAccount(page, accountText);
        await page.goto('/dashboard/accounts');
        await waitForPageReady(page);
      }
    }
  } catch {
    // Cleanup failed, but don't fail the test
    console.warn('Cleanup failed, test data may remain');
  }
}

/**
 * Wait for a toast/notification message to appear and optionally verify its content
 */
export async function waitForToast(
  page: Page,
  options: {
    type?: 'success' | 'error' | 'info' | 'warning';
    message?: string | RegExp;
    timeout?: number;
  } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;

  const toastSelectors = [
    '[role="status"]',
    '[role="alert"]',
    '.toast',
    '.notification',
    '[data-testid="toast"]',
    '.Toastify__toast',
  ];

  // Add type-specific selectors
  if (options.type) {
    toastSelectors.push(`.toast-${options.type}`);
    toastSelectors.push(`[data-type="${options.type}"]`);
  }

  const toast = page.locator(toastSelectors.join(', ')).first();
  await expect(toast).toBeVisible({ timeout });

  if (options.message) {
    if (typeof options.message === 'string') {
      await expect(toast).toContainText(options.message);
    } else {
      await expect(toast).toHaveText(options.message);
    }
  }
}

/**
 * Fill a form with multiple fields at once
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string | number | boolean>
): Promise<void> {
  for (const [fieldName, value] of Object.entries(fields)) {
    const input = page.getByLabel(new RegExp(fieldName, 'i')).or(
      page.locator(`#${fieldName}`).or(
        page.locator(`[name="${fieldName}"]`)
      )
    );

    if (typeof value === 'boolean') {
      if (value) {
        await input.check();
      } else {
        await input.uncheck();
      }
    } else {
      await input.fill(value.toString());
    }
  }
}

/**
 * Verify form field has specific value
 */
export async function verifyFormField(
  page: Page,
  fieldName: string,
  expectedValue: string
): Promise<void> {
  const input = page.getByLabel(new RegExp(fieldName, 'i')).or(
    page.locator(`#${fieldName}`).or(
      page.locator(`[name="${fieldName}"]`)
    )
  );

  await expect(input).toHaveValue(expectedValue);
}

/**
 * Get the count of items in a list or table
 */
export async function getListItemCount(page: Page, listSelector: string): Promise<number> {
  const items = page.locator(`${listSelector} > *`);
  return await items.count();
}

/**
 * Verify an item exists in a list
 */
export async function verifyItemInList(
  page: Page,
  itemText: string,
  listSelector?: string
): Promise<void> {
  const selector = listSelector || 'main';
  const list = page.locator(selector);
  await expect(list.getByText(itemText)).toBeVisible();
}

/**
 * Verify an item does not exist in a list
 */
export async function verifyItemNotInList(
  page: Page,
  itemText: string,
  listSelector?: string
): Promise<void> {
  const selector = listSelector || 'main';
  const list = page.locator(selector);
  await expect(list.getByText(itemText)).not.toBeVisible();
}
