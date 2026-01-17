import { atom } from 'nanostores';

export type Theme = 'bloomberg' | 'modern' | 'dashboard' | 'system';
export type ResolvedTheme = 'bloomberg' | 'modern' | 'dashboard';

// Detect system preference (dark = dashboard, light = modern)
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dashboard';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'modern' : 'dashboard';
}

// Resolve 'system' to actual theme
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dashboard';
  const saved = localStorage.getItem('theme') as Theme;
  if (saved && ['bloomberg', 'modern', 'dashboard', 'system'].includes(saved)) {
    return saved;
  }
  return 'system'; // Default to system preference
};

export const $theme = atom<Theme>('system');
export const $resolvedTheme = atom<ResolvedTheme>('dashboard');

export function initTheme() {
  if (typeof window === 'undefined') return;
  const saved = getInitialTheme();
  setTheme(saved);

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  mediaQuery.addEventListener('change', () => {
    if ($theme.get() === 'system') {
      applyTheme(getSystemTheme());
    }
  });
}

function applyTheme(resolved: ResolvedTheme) {
  $resolvedTheme.set(resolved);
  if (typeof window !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }
}

export function setTheme(theme: Theme) {
  $theme.set(theme);
  const resolved = resolveTheme(theme);
  applyTheme(resolved);

  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
}

export const themeNames: Record<Theme, string> = {
  system: 'System',
  bloomberg: 'Bloomberg Terminal',
  modern: 'Modern Fintech',
  dashboard: 'Dashboard Dark',
};
