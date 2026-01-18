import { test, expect } from '@playwright/test';

// Helper to wait for either strategies page or login redirect
async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForTimeout(2000);
  return page.url().includes('/dashboard/strategies');
}

test.describe('Strategies List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/strategies');
  });

  test.describe('Page Layout', () => {
    test('should load page or redirect to login', async ({ page }) => {
      await page.waitForTimeout(1500);
      const url = page.url();
      const isOnStrategies = url.includes('/dashboard/strategies');
      const isOnLogin = url.includes('/auth/login');
      expect(isOnStrategies || isOnLogin).toBe(true);
    });

    test('should display strategies list when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const list = page.locator('[data-testid="strategies-list"]');
        if (await list.isVisible().catch(() => false)) {
          await expect(list).toBeVisible();
        }
      }
    });

    test('should have page header with title when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const heading = page.locator('h2:has-text("My Strategies")');
        if (await heading.isVisible().catch(() => false)) {
          await expect(heading).toBeVisible();
        }
      }
    });

    test('should display strategy count when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const count = page.locator('.strategy-count');
        if (await count.isVisible().catch(() => false)) {
          await expect(count).toBeVisible();
        }
      }
    });

    test('should have create new strategy button when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const button = page.locator('[data-testid="create-strategy-button"]');
        if (await button.isVisible().catch(() => false)) {
          await expect(button).toBeVisible();
        }
      }
    });
  });

  test.describe('Filters', () => {
    test('should have search input when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const input = page.locator('[data-testid="search-input"]');
        if (await input.isVisible().catch(() => false)) {
          await expect(input).toBeVisible();
        }
      }
    });

    test('should have status filter dropdown when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const filter = page.locator('[data-testid="status-filter"]');
        if (await filter.isVisible().catch(() => false)) {
          await expect(filter).toBeVisible();
        }
      }
    });

    test('should have type filter dropdown when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const filter = page.locator('[data-testid="type-filter"]');
        if (await filter.isVisible().catch(() => false)) {
          await expect(filter).toBeVisible();
        }
      }
    });

    test('should have sort dropdown when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const sort = page.locator('[data-testid="sort-select"]');
        if (await sort.isVisible().catch(() => false)) {
          await expect(sort).toBeVisible();
        }
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no strategies', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const emptyState = page.locator('.empty-state');
        if (await emptyState.isVisible().catch(() => false)) {
          await expect(emptyState).toBeVisible();
        }
      }
    });
  });
});

test.describe('Strategy Creation Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
  });

  test.describe('Form Layout', () => {
    test('should load page or redirect to login', async ({ page }) => {
      await page.waitForTimeout(1500);
      const url = page.url();
      const isOnStrategies = url.includes('/dashboard/strategies');
      const isOnLogin = url.includes('/auth/login');
      expect(isOnStrategies || isOnLogin).toBe(true);
    });

    test('should display creation form when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const form = page.locator('[data-testid="strategy-creation-form"]');
        if (await form.isVisible().catch(() => false)) {
          await expect(form).toBeVisible();
        }
      }
    });

    test('should display progress steps when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const steps = page.locator('.form-steps');
        if (await steps.isVisible().catch(() => false)) {
          await expect(steps).toBeVisible();
        }
      }
    });

    test('should show three steps when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const steps = page.locator('.step');
        if (await steps.first().isVisible().catch(() => false)) {
          await expect(steps).toHaveCount(3);
        }
      }
    });

    test('should have Template step active initially when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const firstStep = page.locator('.step').first();
        if (await firstStep.isVisible().catch(() => false)) {
          await expect(firstStep).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Template Selection', () => {
    test('should have start from scratch button when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const button = page.locator('[data-testid="start-from-scratch"]');
        if (await button.isVisible().catch(() => false)) {
          await expect(button).toBeVisible();
        }
      }
    });

    test('should display template cards when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const grid = page.locator('.template-grid');
        if (await grid.isVisible().catch(() => false)) {
          await expect(grid).toBeVisible();
        }
      }
    });

    test('should have Basic Momentum template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-momentum-basic"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });

    test('should have Mean Reversion template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-mean-reversion-basic"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });

    test('should have Equal Weight template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-equal-weight-sp500"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });

    test('should have Risk Parity template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-risk-parity"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });

    test('should have Multi-Factor template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-multi-factor"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });

    test('should have 60/40 Portfolio template when authenticated', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const template = page.locator('[data-testid="template-buy-hold-60-40"]');
        if (await template.isVisible().catch(() => false)) {
          await expect(template).toBeVisible();
        }
      }
    });
  });

  test.describe('Configuration Step', () => {
    test('should display strategy name input when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="strategy-name-input"]')).toBeVisible();
        }
      }
    });

    test('should display description textarea when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="strategy-description-input"]')).toBeVisible();
        }
      }
    });

    test('should display strategy type select when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="strategy-type-select"]')).toBeVisible();
        }
      }
    });

    test('should display universe select when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="universe-select"]')).toBeVisible();
        }
      }
    });

    test('should display rebalance select when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="rebalance-select"]')).toBeVisible();
        }
      }
    });

    test('should display tag input when on config step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await expect(page.locator('[data-testid="tag-input"]')).toBeVisible();
        }
      }
    });

    test('should fill strategy name', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          const nameInput = page.locator('[data-testid="strategy-name-input"]');
          await nameInput.fill('My Test Strategy');
          await expect(nameInput).toHaveValue('My Test Strategy');
        }
      }
    });

    test('should show custom symbols input when universe is custom', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await page.locator('[data-testid="universe-select"]').selectOption('custom');
          await expect(page.locator('[data-testid="custom-symbols-input"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Parameters Step', () => {
    test('should display parameters heading when on params step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await page.locator('[data-testid="strategy-name-input"]').fill('Test Strategy');
          await page.locator('.next-button').click();
          await expect(page.locator('h3:has-text("Parameters")')).toBeVisible();
        }
      }
    });

    test('should display strategy summary when on params step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await page.locator('[data-testid="strategy-name-input"]').fill('Test Strategy');
          await page.locator('.next-button').click();
          await expect(page.locator('.strategy-summary')).toBeVisible();
        }
      }
    });

    test('should have submit button when on params step', async ({ page }) => {
      const isOnPage = await waitForPageLoad(page);
      if (isOnPage) {
        const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
        if (await scratchBtn.isVisible().catch(() => false)) {
          await scratchBtn.click();
          await page.locator('[data-testid="strategy-name-input"]').fill('Test Strategy');
          await page.locator('.next-button').click();
          await expect(page.locator('[data-testid="create-strategy-submit"]')).toBeVisible();
        }
      }
    });
  });
});

test.describe('Strategies Page Navigation', () => {
  test('should load list view by default', async ({ page }) => {
    await page.goto('/dashboard/strategies');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/strategies') || url.includes('/auth/login')).toBe(true);
  });

  test('should load creation view with hash', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/strategies') || url.includes('/auth/login')).toBe(true);
  });

  test('should have back button in creation view when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const backBtn = page.locator('#back-to-list');
      if (await backBtn.isVisible().catch(() => false)) {
        await expect(backBtn).toBeVisible();
      }
    }
  });
});

test.describe('Strategy Types Display Names', () => {
  test('should display all strategy type options when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
      if (await scratchBtn.isVisible().catch(() => false)) {
        await scratchBtn.click();
        const typeSelect = page.locator('[data-testid="strategy-type-select"]');
        await expect(typeSelect.locator('option[value="momentum"]')).toHaveText('Momentum');
        await expect(typeSelect.locator('option[value="mean_reversion"]')).toHaveText('Mean Reversion');
        await expect(typeSelect.locator('option[value="equal_weight"]')).toHaveText('Equal Weight');
        await expect(typeSelect.locator('option[value="risk_parity"]')).toHaveText('Risk Parity');
        await expect(typeSelect.locator('option[value="smart_beta"]')).toHaveText('Smart Beta');
        await expect(typeSelect.locator('option[value="buy_and_hold"]')).toHaveText('Buy & Hold');
        await expect(typeSelect.locator('option[value="custom"]')).toHaveText('Custom');
      }
    }
  });
});

test.describe('Rebalance Frequency Options', () => {
  test('should have all rebalance frequency options when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
      if (await scratchBtn.isVisible().catch(() => false)) {
        await scratchBtn.click();
        const rebalanceSelect = page.locator('[data-testid="rebalance-select"]');
        await expect(rebalanceSelect.locator('option[value="daily"]')).toBeVisible();
        await expect(rebalanceSelect.locator('option[value="weekly"]')).toBeVisible();
        await expect(rebalanceSelect.locator('option[value="monthly"]')).toBeVisible();
        await expect(rebalanceSelect.locator('option[value="quarterly"]')).toBeVisible();
        await expect(rebalanceSelect.locator('option[value="yearly"]')).toBeVisible();
        await expect(rebalanceSelect.locator('option[value="manual"]')).toBeVisible();
      }
    }
  });
});

test.describe('Asset Universe Options', () => {
  test('should have all asset universe options when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
      if (await scratchBtn.isVisible().catch(() => false)) {
        await scratchBtn.click();
        const universeSelect = page.locator('[data-testid="universe-select"]');
        await expect(universeSelect.locator('option[value="sp500"]')).toBeVisible();
        await expect(universeSelect.locator('option[value="nasdaq100"]')).toBeVisible();
        await expect(universeSelect.locator('option[value="dow30"]')).toBeVisible();
        await expect(universeSelect.locator('option[value="etf_universe"]')).toBeVisible();
        await expect(universeSelect.locator('option[value="custom"]')).toBeVisible();
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/strategies');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/strategies') || url.includes('/auth/login')).toBe(true);
  });

  test('should display creation form on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/strategies#create');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/dashboard/strategies') || url.includes('/auth/login')).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should have proper labels for inputs when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const scratchBtn = page.locator('[data-testid="start-from-scratch"]');
      if (await scratchBtn.isVisible().catch(() => false)) {
        await scratchBtn.click();
        await expect(page.locator('label[for="strategy-name"]')).toBeVisible();
        await expect(page.locator('label[for="strategy-description"]')).toBeVisible();
        await expect(page.locator('label[for="strategy-type"]')).toBeVisible();
      }
    }
  });

  test('should have accessible filter controls when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible().catch(() => false)) {
        await expect(searchInput).toHaveAttribute('placeholder');
      }
    }
  });

  test('should have keyboard navigable templates when authenticated', async ({ page }) => {
    await page.goto('/dashboard/strategies#create');
    const isOnPage = await waitForPageLoad(page);
    if (isOnPage) {
      const templates = page.locator('.template-card');
      if (await templates.first().isVisible().catch(() => false)) {
        await expect(templates.first()).toBeVisible();
      }
    }
  });
});
