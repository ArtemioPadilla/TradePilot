import { defineConfig, devices } from '@playwright/test';

/**
 * TradePilot Playwright E2E Test Configuration
 *
 * Project Structure:
 * - authenticated: Tests requiring regular user authentication
 * - admin: Tests requiring admin authentication
 * - chromium: Unauthenticated tests (auth pages, landing, etc.)
 * - lighthouse: Performance audits
 * - Mobile Chrome/Safari: Mobile responsiveness tests
 *
 * Note: Firebase stores auth in IndexedDB which isn't captured by storageState.
 * Tests use the ensureAuthenticated() helper from test-utils.ts to login when needed.
 *
 * Environment variables required for authenticated tests:
 * - TEST_USER_EMAIL: Regular user email
 * - TEST_USER_PASSWORD: Regular user password
 * - TEST_ADMIN_EMAIL: Admin user email
 * - TEST_ADMIN_PASSWORD: Admin user password
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // === AUTHENTICATED TESTS (Regular User) ===
    {
      name: 'authenticated',
      testMatch: [
        '**/dashboard.spec.ts',
        '**/accounts.spec.ts',
        '**/trading.spec.ts',
        '**/alerts*.spec.ts',
        '**/settings*.spec.ts',
        '**/user-journeys.spec.ts',
        '**/holdings.spec.ts',
        '**/strategies*.spec.ts',
        '**/backtest*.spec.ts',
        '**/goals.spec.ts',
        '**/tools.spec.ts',
        '**/csv-import.spec.ts',
        '**/data-table.spec.ts',
        '**/portfolio-calculations.spec.ts',
        '**/dashboard-components.spec.ts',
        '**/trading-components.spec.ts',
        '**/common-components.spec.ts',
        '**/leaderboard.spec.ts',
        '**/form-journeys.spec.ts',
        '**/placeholder-pages.spec.ts',
        '**/pwa.spec.ts',
        '**/offline-mode.spec.ts',
        '**/markets.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // === ADMIN TESTS ===
    {
      name: 'admin',
      testMatch: '**/admin.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // === UNAUTHENTICATED TESTS ===
    {
      name: 'chromium',
      testMatch: ['**/auth.spec.ts', '**/auth-flows.spec.ts', '**/landing.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // === LIGHTHOUSE PERFORMANCE AUDIT ===
    {
      name: 'lighthouse',
      testMatch: '**/*.audit.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--remote-debugging-port=9222'],
        },
      },
    },

    // === MOBILE TESTS (Unauthenticated) ===
    {
      name: 'Mobile Chrome',
      testMatch: ['**/landing.spec.ts'],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testMatch: ['**/landing.spec.ts'],
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
