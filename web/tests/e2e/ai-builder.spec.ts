import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './test-utils';

/**
 * AI Strategy Builder E2E Tests
 *
 * Tests for the AI Strategy Builder page — demo mode functionality,
 * chat interface, code generation, and strategy execution.
 */

test.describe('AI Strategy Builder', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/ai');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('should display AI Builder page when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/ai/);
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display the AI Strategy Builder component', async ({ page }) => {
    const builder = page.locator('[data-testid="ai-strategy-builder"]');
    await expect(builder).toBeVisible();
  });

  test('should display empty state with prompt suggestions', async ({ page }) => {
    // Should show example prompt buttons in the chat area
    const exampleButton = page.locator('button').filter({ hasText: /momentum|oversold|crossover/i });
    const count = await exampleButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display template quick-start buttons', async ({ page }) => {
    const templateChip = page.locator('.template-chip').first();
    await expect(templateChip).toBeVisible();
  });

  test('should show empty code panel initially', async ({ page }) => {
    const emptyOutput = page.locator('[data-testid="empty-output"]');
    await expect(emptyOutput).toBeVisible();
  });

  test('should generate strategy from template click', async ({ page }) => {
    // Click first template chip
    const templateChip = page.locator('.template-chip').first();
    await templateChip.click();

    // Wait for the chat response
    await page.waitForTimeout(1000);

    // Code editor should now have content
    const codeEditor = page.locator('[data-testid="code-editor"]');
    await expect(codeEditor).toBeVisible();
    const code = await codeEditor.inputValue();
    expect(code).toContain('function strategy');
  });

  test('should generate strategy from chat input', async ({ page }) => {
    // Type a strategy description
    const textarea = page.locator('textarea[placeholder*="Describe your trading strategy"]');
    await textarea.fill('Buy stocks with the highest momentum over 20 days');

    // Submit
    const sendButton = page.locator('button[aria-label="Send message"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Should show generated code
    const codeEditor = page.locator('[data-testid="code-editor"]');
    await expect(codeEditor).toBeVisible();
  });

  test('should run backtest on generated strategy', async ({ page }) => {
    // First generate a strategy using a template
    const templateChip = page.locator('.template-chip').first();
    await templateChip.click();
    await page.waitForTimeout(1000);

    // Click run backtest
    const runBtn = page.locator('[data-testid="run-backtest-btn"]');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    await page.waitForTimeout(500);

    // Should show execution results (success badge or ranked symbols)
    const statusBadge = page.locator('.status-badge');
    await expect(statusBadge.first()).toBeVisible();
  });

  test('should display example prompts that trigger strategy generation', async ({ page }) => {
    // Click an example prompt button from the empty state
    const exampleBtn = page.locator('.example-prompts button').first();
    await exampleBtn.click();

    await page.waitForTimeout(1000);

    // Chat should now have messages
    const messages = page.locator('.chat-message');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2); // user + AI response
  });
});
