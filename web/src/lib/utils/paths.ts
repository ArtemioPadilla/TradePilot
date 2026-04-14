/**
 * Path utilities for GitHub Pages deployment.
 *
 * When Astro's `base` is set (e.g. '/TradePilot'), all app-internal paths
 * must be prefixed with the base path. This module provides a single helper
 * so that every .tsx/.ts file can build correct URLs without hard-coding
 * the prefix.
 *
 * In .astro templates use `import.meta.env.BASE_URL` directly instead.
 */

/** The base URL set in astro.config.mjs (includes trailing slash). */
export const BASE = import.meta.env.BASE_URL || '/';

/**
 * Prefix a root-relative path with the Astro base URL.
 *
 * @example
 *   appPath('/')               // '/TradePilot/'
 *   appPath('/dashboard')      // '/TradePilot/dashboard'
 *   appPath('/auth/login')     // '/TradePilot/auth/login'
 */
export function appPath(path: string): string {
  const base = BASE.endsWith('/') ? BASE : BASE + '/';
  return base + path.replace(/^\//, '');
}
