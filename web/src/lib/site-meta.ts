/**
 * ⚠️ RE-BRAND ON INSTANTIATION — single source of the site's machine-readable
 * identity.
 *
 * Everything an external agent (LLM crawler, search engine, tooling) learns
 * about this site flows from this object: /llms.txt, /llms-full.txt, the
 * JSON-LD blocks (WebSite, SoftwareSourceCode, Article, BreadcrumbList), and
 * the default <meta name="description">.
 *
 * If you are an agent instantiating a project FROM this template (via
 * create-inceptor-app or a fork): update every field below to the new
 * project's identity, or the new site will introduce itself to the world as
 * "Inceptor". `repoSlug` honors PUBLIC_REPO_SLUG so CI/fork setups can
 * override without an edit. See CLAUDE.md § "Agent-readable surface".
 */

/**
 * Canonical production origin — must match SITE_ORIGIN in /site.config.mjs.
 *
 * WHY declared twice (here + site.config.mjs):
 *   astro.config.mjs runs in Node before Vite starts, so it cannot import
 *   TypeScript files that use `import.meta.env`. Both files declare the same
 *   string; the vitest in src/tests/site-meta.test.ts and the doctor script
 *   assert they are in sync so a stale one-sided edit is caught immediately.
 *
 * RE-BRAND: update this AND SITE_ORIGIN in /site.config.mjs to your domain.
 */
export const SITE_ORIGIN = 'https://artemiop.com';
export const SITE = {
  /** Product name as it should appear to agents and search engines. */
  name: 'TradePilot',
  /** One-line positioning (used as the default meta description). */
  description:
    'Algorithmic trading workbench: backtest strategies in your browser — ' +
    'momentum, mean reversion, smart beta — with portfolio optimization, ' +
    'a Backtest Lab, and community leaderboards. Astro 5 + React 19 islands.',
  /** owner/repo on GitHub. */
  repoSlug: (import.meta.env.PUBLIC_REPO_SLUG as string | undefined) ?? 'ArtemioPadilla/TradePilot',
  /** SPDX license id of the codebase. */
  license: 'MIT',
  /** Languages an agent should expect in the source. */
  programmingLanguages: ['TypeScript', 'Astro', 'CSS', 'Python'],
} as const;

/** Absolute repo URL derived from the slug. */
export const REPO_URL = `https://github.com/${SITE.repoSlug}`;

/** Absolute site origin + base (e.g. https://artemiop.com/inceptor). */
export function siteUrl(site: URL | undefined, base: string): string {
  const origin = (site ?? new URL('https://localhost')).origin;
  return `${origin}${base.replace(/\/$/, '')}`;
}
