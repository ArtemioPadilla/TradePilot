/**
 * Create Strategy User Journey
 *
 * Tests the strategy creation flow.
 */

import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Strategy', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/strategies');
    await waitForPageReady(page);
  });

  test('should display strategies page heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /strateg/i });
    await expect(heading).toBeVisible();
  });

  test('should display new strategy button', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new|create|add/i });
    await expect(newButton).toBeVisible();
  });

  test('should display strategy templates', async ({ page }) => {
    // Look for template section or cards
    const templates = page.locator('text=/template|momentum|mean.*reversion|equal.*weight/i');
    const templateCards = page.locator('.template-card, [data-testid="template"]');

    const hasTemplates = await templates.first().isVisible().catch(() => false);
    const hasCards = await templateCards.first().isVisible().catch(() => false);

    expect(hasTemplates || hasCards).toBe(true);
  });

  test('should show template options when creating new strategy', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new|create/i });
    await newButton.click();
    await page.waitForTimeout(300);

    // Should show templates or blank option
    const momentumOption = page.locator('text=/momentum/i');
    const blankOption = page.locator('text=/blank|scratch|empty/i');

    const hasMomentum = await momentumOption.first().isVisible().catch(() => false);
    const hasBlank = await blankOption.first().isVisible().catch(() => false);

    expect(hasMomentum || hasBlank).toBe(true);
  });

  test('should select momentum template', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new|create/i });
    await newButton.click();
    await page.waitForTimeout(300);

    // Click on momentum template
    const momentumOption = page.locator('text=/momentum/i').first();
    if (await momentumOption.isVisible()) {
      await momentumOption.click();
      await page.waitForTimeout(300);

      // Should show configuration or name input
      const hasConfig = await page.locator('text=/configure|parameters|settings/i').isVisible().catch(() => false);
      const hasNameInput = await page.getByLabel(/name/i).isVisible().catch(() => false);
      const selected = await page.locator('.selected, [aria-selected="true"]').isVisible().catch(() => false);

      expect(hasConfig || hasNameInput || selected).toBe(true);
    }
  });

  test('should require strategy name', async ({ page }) => {
    // Open new strategy flow
    await page.getByRole('button', { name: /new|create/i }).click();
    await page.waitForTimeout(300);

    // Try to save without name
    const saveButton = page.getByRole('button', { name: /save|create|confirm/i }).last();
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show validation error or remain in form
      const hasError = await page.locator('.error, [aria-invalid], text=/required|name/i').isVisible().catch(() => false);
      const stillInForm = await page.locator('text=/template|new.*strategy/i').isVisible().catch(() => false);

      expect(hasError || stillInForm).toBe(true);
    }
  });

  test('should display my strategies list', async ({ page }) => {
    // Look for personal strategies section
    const myStrategies = page.locator('text=/my.*strateg|your.*strateg/i');
    const strategyList = page.locator('.strategy-list, [data-testid="strategies"]');
    const strategyCards = page.locator('.strategy-card');

    const hasSection = await myStrategies.first().isVisible().catch(() => false);
    const hasList = await strategyList.isVisible().catch(() => false);
    const hasCards = await strategyCards.first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/no.*strateg|create.*first/i').isVisible().catch(() => false);

    expect(hasSection || hasList || hasCards || hasEmpty).toBe(true);
  });

  test('should display public strategies section', async ({ page }) => {
    // Look for public strategies
    const publicSection = page.locator('text=/public|community|shared/i');
    const publicStrategies = page.locator('[data-testid="public-strategies"]');

    const hasPublicSection = await publicSection.first().isVisible().catch(() => false);
    const hasPublicList = await publicStrategies.isVisible().catch(() => false);

    expect(hasPublicSection || hasPublicList).toBe(true);
  });

  test('should have edit action for strategy', async ({ page }) => {
    // Find a strategy card with edit button
    const editButton = page.getByRole('button', { name: /edit/i });
    const editIcon = page.locator('[aria-label*="edit" i], .edit-icon');

    const hasEditButton = await editButton.first().isVisible().catch(() => false);
    const hasEditIcon = await editIcon.first().isVisible().catch(() => false);

    // If strategies exist, should have edit option
    const hasStrategies = await page.locator('.strategy-card').first().isVisible().catch(() => false);
    if (hasStrategies) {
      expect(hasEditButton || hasEditIcon).toBe(true);
    }
  });

  test('should have backtest action for strategy', async ({ page }) => {
    // Find backtest button
    const backtestButton = page.getByRole('button', { name: /backtest|test/i });
    const backtestLink = page.locator('a[href*="backtest"]');

    const hasBacktestButton = await backtestButton.first().isVisible().catch(() => false);
    const hasBacktestLink = await backtestLink.first().isVisible().catch(() => false);

    // If strategies exist, should have backtest option
    const hasStrategies = await page.locator('.strategy-card').first().isVisible().catch(() => false);
    if (hasStrategies) {
      expect(hasBacktestButton || hasBacktestLink).toBe(true);
    }
  });

  test('should show strategy parameters configuration', async ({ page }) => {
    // Click on a strategy to view/edit
    const strategyCard = page.locator('.strategy-card, [data-testid="strategy"]').first();

    if (await strategyCard.isVisible()) {
      await strategyCard.click();
      await page.waitForTimeout(300);

      // Should show parameters or configuration
      const hasParams = await page.locator('text=/parameter|config|setting/i').isVisible().catch(() => false);
      const hasForm = await page.locator('form, .strategy-form').isVisible().catch(() => false);

      expect(hasParams || hasForm).toBe(true);
    }
  });
});
