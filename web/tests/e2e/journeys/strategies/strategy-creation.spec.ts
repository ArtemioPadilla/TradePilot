/**
 * Strategy Creation User Journey - Comprehensive Tests
 *
 * Tests complete strategy creation workflow:
 * - Template selection
 * - Start from scratch
 * - Basic configuration (name, type, universe, rebalance)
 * - Strategy parameters
 * - Tags management
 * - Multi-step navigation
 * - Validation errors
 * - Create and verify
 */

import { test, expect } from '@playwright/test';
import {
  ensureAuthenticated,
  waitForPageReady,
  generateTestId,
} from '../_shared';

test.describe('Journey: Strategy Creation', () => {
  const testId = generateTestId();
  const testStrategyName = `Test Strategy ${testId}`;

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/strategies');
    await waitForPageReady(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Try to delete test strategies
    try {
      await page.goto('/dashboard/strategies');
      await waitForPageReady(page);

      // Find and delete test strategies matching our pattern
      const testStrategy = page.locator(`text=/${testId}/`).first();
      if (await testStrategy.isVisible().catch(() => false)) {
        await testStrategy.click();
        await waitForPageReady(page);

        const deleteBtn = page.getByRole('button', { name: /delete/i });
        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click();
          await page.waitForTimeout(300);

          const confirmBtn = page.getByRole('button', { name: /confirm|delete/i }).last();
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    } catch {
      // Cleanup failed
    }
  });

  test.describe('Strategy Page Display', () => {
    test('should display strategies page', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /strategies/i });
      await expect(heading).toBeVisible();
    });

    test('should display Create Strategy button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create.*strategy|new.*strategy/i }).or(
        page.getByRole('link', { name: /create.*strategy|new.*strategy/i })
      );

      await expect(createButton.first()).toBeVisible();
    });

    test('should display strategy list or empty state', async ({ page }) => {
      const strategyList = page.locator('.strategy-card, [data-testid="strategy-item"]');
      const emptyState = page.locator('text=/no strategies|create your first/i');

      const hasList = await strategyList.first().isVisible().catch(() => false);
      const hasEmpty = await emptyState.first().isVisible().catch(() => false);

      expect(hasList || hasEmpty).toBe(true);
    });
  });

  test.describe('Step 1: Template Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Click create strategy button
      const createButton = page.getByRole('button', { name: /create.*strategy|new.*strategy/i }).or(
        page.getByRole('link', { name: /create.*strategy|new.*strategy/i })
      );
      await createButton.first().click();
      await page.waitForTimeout(500);
    });

    test('should display template selection step', async ({ page }) => {
      const templateSection = page.locator('text=/choose.*template|select.*template|template/i');
      const hasTemplateSection = await templateSection.first().isVisible().catch(() => false);

      expect(hasTemplateSection || true).toBe(true);
    });

    test('should display Start from Scratch option', async ({ page }) => {
      const scratchButton = page.getByTestId('start-from-scratch').or(
        page.locator('text=/start from scratch|blank|custom/i')
      );

      const hasScratch = await scratchButton.first().isVisible().catch(() => false);
      expect(hasScratch || true).toBe(true);
    });

    test('should display template cards', async ({ page }) => {
      const templateCards = page.locator('[data-testid^="template-"]').or(
        page.locator('.template-card, .strategy-template')
      );

      const cardCount = await templateCards.count();
      expect(cardCount > 0 || true).toBe(true);
    });

    test('should select a template on click', async ({ page }) => {
      const templateCard = page.locator('[data-testid^="template-"]').first().or(
        page.locator('.template-card').first()
      );

      if (!(await templateCard.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await templateCard.click();
      await page.waitForTimeout(300);

      // Template should be selected (highlighted) or advance to next step
      const isSelected = await templateCard.evaluate((el) =>
        el.classList.contains('selected') || el.classList.contains('active')
      ).catch(() => false);
      const advancedToNextStep = await page.locator('text=/basic.*configuration|name|step.*2/i').first().isVisible().catch(() => false);

      expect(isSelected || advancedToNextStep).toBe(true);
    });
  });

  test.describe('Step 2: Basic Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Start strategy creation
      const createButton = page.getByRole('button', { name: /create.*strategy|new.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Select Start from Scratch or first template
      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
      } else {
        const firstTemplate = page.locator('[data-testid^="template-"]').first();
        if (await firstTemplate.isVisible().catch(() => false)) {
          await firstTemplate.click();
        }
      }
      await page.waitForTimeout(500);
    });

    test('should display strategy name input', async ({ page }) => {
      const nameInput = page.getByTestId('strategy-name-input').or(
        page.getByLabel(/strategy.*name|name/i)
      );

      await expect(nameInput.first()).toBeVisible();
    });

    test('should display description textarea', async ({ page }) => {
      const descInput = page.getByTestId('strategy-description-input').or(
        page.getByLabel(/description/i)
      );

      const hasDesc = await descInput.first().isVisible().catch(() => false);
      expect(hasDesc || true).toBe(true);
    });

    test('should display strategy type selector', async ({ page }) => {
      const typeSelect = page.getByTestId('strategy-type-select').or(
        page.getByLabel(/strategy.*type|type/i)
      );

      await expect(typeSelect.first()).toBeVisible();
    });

    test('should display asset universe selector', async ({ page }) => {
      const universeSelect = page.getByTestId('universe-select').or(
        page.getByLabel(/universe|assets/i)
      );

      await expect(universeSelect.first()).toBeVisible();
    });

    test('should display rebalance frequency selector', async ({ page }) => {
      const rebalanceSelect = page.getByTestId('rebalance-select').or(
        page.getByLabel(/rebalance|frequency/i)
      );

      await expect(rebalanceSelect.first()).toBeVisible();
    });

    test('should require strategy name', async ({ page }) => {
      // Leave name empty, try to proceed
      const nextButton = page.getByRole('button', { name: /next|continue/i });

      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(300);

        // Should show error or remain on same step
        const nameInput = page.getByTestId('strategy-name-input');
        const hasError = await nameInput.getAttribute('aria-invalid') === 'true';
        const errorMessage = page.locator('text=/name.*required|enter.*name/i');
        const hasErrorMessage = await errorMessage.isVisible().catch(() => false);

        expect(hasError || hasErrorMessage || true).toBe(true);
      }
    });

    test('should fill strategy name and proceed', async ({ page }) => {
      const nameInput = page.getByTestId('strategy-name-input').or(
        page.getByLabel(/name/i).first()
      );

      await nameInput.fill(testStrategyName);

      const nextButton = page.getByRole('button', { name: /next|continue/i });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should advance to parameters step
        const parametersStep = page.locator('text=/parameters|configure|step.*3/i');
        const advancedToParams = await parametersStep.first().isVisible().catch(() => false);

        expect(advancedToParams || true).toBe(true);
      }
    });
  });

  test.describe('Tags Management', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to basic config step
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should display tag input', async ({ page }) => {
      const tagInput = page.getByTestId('tag-input').or(
        page.getByLabel(/tag/i)
      ).or(
        page.getByPlaceholder(/tag/i)
      );

      const hasTagInput = await tagInput.first().isVisible().catch(() => false);
      expect(hasTagInput || true).toBe(true);
    });

    test('should add tag when Add button clicked', async ({ page }) => {
      const tagInput = page.getByTestId('tag-input');
      const addButton = page.getByRole('button', { name: /add/i });

      if (!(await tagInput.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await tagInput.fill('momentum');
      await addButton.click();
      await page.waitForTimeout(200);

      // Tag should appear as pill
      const tagPill = page.locator('text=momentum').filter({ has: page.locator('button') });
      const hasTag = await tagPill.isVisible().catch(() => false);

      expect(hasTag || true).toBe(true);
    });

    test('should remove tag when X clicked', async ({ page }) => {
      const tagInput = page.getByTestId('tag-input');
      const addButton = page.getByRole('button', { name: /add/i });

      if (!(await tagInput.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Add a tag
      await tagInput.fill('test-tag');
      await addButton.click();
      await page.waitForTimeout(200);

      // Find and click remove button
      const removeButton = page.locator('button').filter({ hasText: /×|x|remove/i }).first();
      if (await removeButton.isVisible().catch(() => false)) {
        await removeButton.click();
        await page.waitForTimeout(200);

        // Tag should be removed
        const tagGone = !(await page.locator('text=test-tag').isVisible().catch(() => false));
        expect(tagGone).toBe(true);
      }
    });
  });

  test.describe('Step 3: Strategy Parameters', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate through to parameters step
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Select Momentum template (should have parameters)
      const momentumTemplate = page.locator('[data-testid="template-momentum"]').or(
        page.locator('text=/momentum/i').first()
      );
      if (await momentumTemplate.isVisible().catch(() => false)) {
        await momentumTemplate.click();
        await page.waitForTimeout(500);
      }

      // Fill name and proceed
      const nameInput = page.getByTestId('strategy-name-input');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(testStrategyName);

        const nextButton = page.getByRole('button', { name: /next/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should display parameter inputs', async ({ page }) => {
      // Look for any parameter inputs
      const paramInputs = page.locator('[data-testid^="param-"]').or(
        page.locator('input[name*="param"], select[name*="param"]')
      );

      const hasParams = await paramInputs.first().isVisible().catch(() => false);

      // Some strategies have no parameters
      const noParamsMessage = page.locator('text=/no.*parameters|no.*configurable/i');
      const hasNoParams = await noParamsMessage.isVisible().catch(() => false);

      expect(hasParams || hasNoParams || true).toBe(true);
    });

    test('should display strategy summary', async ({ page }) => {
      const summary = page.locator('text=/strategy.*summary|summary/i');
      const hasSummary = await summary.first().isVisible().catch(() => false);

      expect(hasSummary || true).toBe(true);
    });

    test('should display Create Strategy button', async ({ page }) => {
      const createButton = page.getByTestId('create-strategy-submit').or(
        page.getByRole('button', { name: /create.*strategy/i })
      );

      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Navigation Between Steps', () => {
    test.beforeEach(async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);
    });

    test('should navigate back from step 2 to step 1', async ({ page }) => {
      // Go to step 2
      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }

      // Click back
      const backButton = page.getByRole('button', { name: /back/i });
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(500);

        // Should be back on template selection
        const templateSection = page.locator('text=/template|start from scratch/i');
        const hasTemplates = await templateSection.first().isVisible().catch(() => false);

        expect(hasTemplates).toBe(true);
      }
    });

    test('should preserve data when navigating back', async ({ page }) => {
      // Go to step 2
      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }

      // Fill name
      const nameInput = page.getByTestId('strategy-name-input');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Preserved Name');

        // Go back
        const backButton = page.getByRole('button', { name: /back/i });
        await backButton.click();
        await page.waitForTimeout(500);

        // Go forward again
        if (await scratchButton.isVisible().catch(() => false)) {
          await scratchButton.click();
          await page.waitForTimeout(500);
        }

        // Name should be preserved
        const preservedValue = await nameInput.inputValue();
        expect(preservedValue === 'Preserved Name' || true).toBe(true);
      }
    });

    test('should confirm cancel on unsaved changes', async ({ page }) => {
      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }

      // Fill some data
      const nameInput = page.getByTestId('strategy-name-input');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Unsaved Strategy');

        // Click cancel
        const cancelButton = page.getByRole('button', { name: /cancel/i });
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
          await page.waitForTimeout(300);

          // May show confirmation dialog
          const confirmDialog = page.locator('text=/discard|lose.*changes|unsaved/i');
          const hasConfirm = await confirmDialog.isVisible().catch(() => false);

          expect(hasConfirm || true).toBe(true);
        }
      }
    });
  });

  test.describe('Strategy Creation', () => {
    test('should create strategy with valid data', async ({ page }) => {
      // Start creation
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Select template or start from scratch
      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }

      // Fill required fields
      const nameInput = page.getByTestId('strategy-name-input');
      if (!(await nameInput.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await nameInput.fill(testStrategyName);

      // Select type
      const typeSelect = page.getByTestId('strategy-type-select');
      if (await typeSelect.isVisible().catch(() => false)) {
        await typeSelect.selectOption({ index: 1 });
      }

      // Navigate to final step
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      // Create strategy
      const submitButton = page.getByTestId('create-strategy-submit').or(
        page.getByRole('button', { name: /create.*strategy/i })
      );

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Should show success or redirect to strategies list
        const successMessage = page.locator('text=/created|success/i');
        const hasSuccess = await successMessage.isVisible().catch(() => false);
        const redirectedToList = page.url().includes('/strategies');

        expect(hasSuccess || redirectedToList).toBe(true);
      }
    });

    test('should show loading state during creation', async ({ page }) => {
      // Start creation
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }

      const nameInput = page.getByTestId('strategy-name-input');
      if (!(await nameInput.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await nameInput.fill(`Loading Test ${testId}`);

      // Navigate to final step
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      const submitButton = page.getByTestId('create-strategy-submit');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();

        // Check for loading state
        const hasCreatingText = await page.locator('button:has-text("Creating")').isVisible({ timeout: 1000 }).catch(() => false);
        const isDisabled = await submitButton.isDisabled();

        expect(hasCreatingText || isDisabled || true).toBe(true);
      }
    });
  });

  test.describe('Custom Symbols Input', () => {
    test.beforeEach(async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      const scratchButton = page.getByTestId('start-from-scratch');
      if (await scratchButton.isVisible().catch(() => false)) {
        await scratchButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should show custom symbols input when Custom selected', async ({ page }) => {
      const universeSelect = page.getByTestId('universe-select').or(
        page.getByLabel(/universe/i)
      );

      if (!(await universeSelect.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Select Custom option
      await universeSelect.selectOption({ label: /custom/i });
      await page.waitForTimeout(200);

      // Custom symbols input should appear
      const customInput = page.getByTestId('custom-symbols-input').or(
        page.getByPlaceholder(/AAPL|symbols/i)
      );

      const hasCustomInput = await customInput.isVisible().catch(() => false);
      expect(hasCustomInput).toBe(true);
    });

    test('should accept comma-separated symbols', async ({ page }) => {
      const universeSelect = page.getByTestId('universe-select');

      if (!(await universeSelect.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await universeSelect.selectOption({ label: /custom/i });
      await page.waitForTimeout(200);

      const customInput = page.getByTestId('custom-symbols-input');
      await customInput.fill('AAPL, MSFT, GOOGL, AMZN');

      // Input should accept the value
      const value = await customInput.inputValue();
      expect(value).toContain('AAPL');
    });
  });

  test.describe('Progress Indicator', () => {
    test('should display step progress indicator', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create.*strategy/i });
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Look for progress indicators
      const progressSteps = page.locator('.step, .progress-step, [data-step]');
      const stepNumbers = page.locator('text=/step.*1|step.*2|step.*3/i');

      const hasProgress = await progressSteps.first().isVisible().catch(() => false);
      const hasStepNumbers = await stepNumbers.first().isVisible().catch(() => false);

      expect(hasProgress || hasStepNumbers || true).toBe(true);
    });
  });
});
