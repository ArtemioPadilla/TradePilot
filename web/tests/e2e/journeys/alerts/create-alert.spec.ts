/**
 * Create Alert User Journey
 *
 * Tests the alert creation flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Alert', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/alerts');
    await waitForPageReady(page);
  });

  test('should display alerts page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /alert/i });
    await expect(heading).toBeVisible();
  });

  test('should display create alert button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await expect(createButton).toBeVisible();
  });

  test('should open alert creation form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*alert|new.*alert|add.*alert/i });
    await createButton.click();
    await page.waitForTimeout(300);

    // Check for form or modal
    const hasForm = await page.locator('form, [role="dialog"], .modal').isVisible().catch(() => false);
    const hasSymbolInput = await page.getByLabel(/symbol/i).isVisible().catch(() => false);
    const hasTypeSelector = await page.locator('text=/price.*alert|type/i').isVisible().catch(() => false);

    expect(hasForm || hasSymbolInput || hasTypeSelector).toBe(true);
  });

  test('should display alert type selector', async ({ page }) => {
    await page.getByRole('button', { name: /create|new|add/i }).click();
    await page.waitForTimeout(300);

    // Look for alert type options
    const priceOption = page.locator('text=/price/i');
    const volumeOption = page.locator('text=/volume/i');
    const portfolioOption = page.locator('text=/portfolio|p&l/i');

    const hasPrice = await priceOption.first().isVisible().catch(() => false);
    const hasVolume = await volumeOption.first().isVisible().catch(() => false);
    const hasPortfolio = await portfolioOption.first().isVisible().catch(() => false);

    expect(hasPrice || hasVolume || hasPortfolio).toBe(true);
  });

  test('should display symbol search input', async ({ page }) => {
    await page.getByRole('button', { name: /create|new|add/i }).click();
    await page.waitForTimeout(300);

    // Look for symbol input
    const symbolInput = page.getByLabel(/symbol/i);
    const symbolSearch = page.locator('input[placeholder*="symbol" i], input[placeholder*="search" i]');

    const hasSymbolInput = await symbolInput.isVisible().catch(() => false);
    const hasSymbolSearch = await symbolSearch.first().isVisible().catch(() => false);

    expect(hasSymbolInput || hasSymbolSearch).toBe(true);
  });

  test('should display condition selector', async ({ page }) => {
    await page.getByRole('button', { name: /create|new|add/i }).click();
    await page.waitForTimeout(300);

    // Look for condition options
    const conditionSelector = page.getByLabel(/condition/i);
    const aboveOption = page.locator('text=/above|greater/i');
    const belowOption = page.locator('text=/below|less/i');

    const hasSelector = await conditionSelector.isVisible().catch(() => false);
    const hasAbove = await aboveOption.first().isVisible().catch(() => false);
    const hasBelow = await belowOption.first().isVisible().catch(() => false);

    expect(hasSelector || hasAbove || hasBelow).toBe(true);
  });

  test('should display threshold/value input', async ({ page }) => {
    await page.getByRole('button', { name: /create|new|add/i }).click();
    await page.waitForTimeout(300);

    // Look for value/threshold input
    const valueInput = page.getByLabel(/value|price|threshold|target/i);
    const numberInput = page.locator('input[type="number"]');

    const hasValueInput = await valueInput.isVisible().catch(() => false);
    const hasNumberInput = await numberInput.first().isVisible().catch(() => false);

    expect(hasValueInput || hasNumberInput).toBe(true);
  });

  test('should display notification channel options', async ({ page }) => {
    await page.getByRole('button', { name: /create|new|add/i }).click();
    await page.waitForTimeout(300);

    // Look for notification options
    const pushOption = page.locator('text=/push|browser/i');
    const emailOption = page.locator('text=/email/i');
    const inAppOption = page.locator('text=/in-app|app/i');
    const notificationSection = page.locator('text=/notification|notify|channel/i');

    const hasPush = await pushOption.first().isVisible().catch(() => false);
    const hasEmail = await emailOption.first().isVisible().catch(() => false);
    const hasInApp = await inAppOption.first().isVisible().catch(() => false);
    const hasSection = await notificationSection.first().isVisible().catch(() => false);

    expect(hasPush || hasEmail || hasInApp || hasSection).toBe(true);
  });

  test('should display alerts list', async ({ page }) => {
    // Look for alerts list or empty state
    const alertsList = page.locator('.alerts-list, [data-testid="alerts"]');
    const alertCards = page.locator('.alert-card, [data-testid="alert"]');
    const emptyState = page.locator('text=/no.*alert|create.*first/i');

    const hasList = await alertsList.isVisible().catch(() => false);
    const hasCards = await alertCards.first().isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasCards || hasEmpty).toBe(true);
  });

  test('should show active/triggered tabs or sections', async ({ page }) => {
    // Look for tabs or sections
    const activeTab = page.getByRole('tab', { name: /active/i });
    const triggeredTab = page.getByRole('tab', { name: /triggered|history/i });
    const activeSection = page.locator('text=/active.*alert/i');
    const triggeredSection = page.locator('text=/triggered|history/i');

    const hasActivTab = await activeTab.isVisible().catch(() => false);
    const hasTriggeredTab = await triggeredTab.isVisible().catch(() => false);
    const hasActiveSection = await activeSection.first().isVisible().catch(() => false);
    const hasTriggeredSection = await triggeredSection.first().isVisible().catch(() => false);

    expect(hasActivTab || hasTriggeredTab || hasActiveSection || hasTriggeredSection).toBe(true);
  });

  test('should have enable/disable toggle for alerts', async ({ page }) => {
    // Find existing alerts with toggle
    const toggleSwitch = page.locator('[role="switch"], input[type="checkbox"], .toggle');
    const alertCard = page.locator('.alert-card, [data-testid="alert"]');

    const hasAlerts = await alertCard.first().isVisible().catch(() => false);
    if (hasAlerts) {
      const hasToggle = await toggleSwitch.first().isVisible().catch(() => false);
      expect(hasToggle).toBe(true);
    }
  });

  test('should have edit and delete actions for alerts', async ({ page }) => {
    // Find alert with actions
    const alertCard = page.locator('.alert-card, [data-testid="alert"]').first();

    if (await alertCard.isVisible()) {
      const editButton = alertCard.getByRole('button', { name: /edit/i });
      const deleteButton = alertCard.getByRole('button', { name: /delete|remove/i });
      const menuButton = alertCard.locator('[aria-label*="menu" i], .menu-button');

      const hasEdit = await editButton.isVisible().catch(() => false);
      const hasDelete = await deleteButton.isVisible().catch(() => false);
      const hasMenu = await menuButton.isVisible().catch(() => false);

      expect(hasEdit || hasDelete || hasMenu).toBe(true);
    }
  });
});
