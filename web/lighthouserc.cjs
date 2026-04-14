/**
 * Lighthouse CI Configuration
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */
module.exports = {
  ci: {
    collect: {
      // Start dev server and collect Lighthouse data
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/auth/login',
        'http://localhost:4321/auth/register',
        'http://localhost:4321/dashboard',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility audits
        'color-contrast': 'warn',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
        'image-alt': 'error',
        'link-name': 'warn',
        'button-name': 'warn',
        'label': 'warn',

        // Best practices
        'uses-https': 'off', // Allow HTTP for local dev
        'is-on-https': 'off',
        'no-document-write': 'error',
        'no-vulnerable-libraries': 'warn',
        'js-libraries': 'off',

        // SEO
        'viewport': 'error',
        'meta-description': 'warn',
        'robots-txt': 'off', // Not needed for SPA
      },
    },
    upload: {
      // Upload to temporary public storage for CI
      target: 'temporary-public-storage',
    },
  },
};
