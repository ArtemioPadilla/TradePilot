import { atom } from 'nanostores';

export type Theme = 'bloomberg' | 'modern' | 'dashboard' | 'system' | 'custom';
export type ResolvedTheme = 'bloomberg' | 'modern' | 'dashboard' | 'custom';

// Custom theme color configuration
export interface CustomThemeColors {
  accent: string;
  accentRgb: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  positive: string;
  negative: string;
}

// Default custom theme colors (based on dashboard dark)
export const defaultCustomColors: CustomThemeColors = {
  accent: '#6366f1',
  accentRgb: '99, 102, 241',
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgElevated: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  positive: '#22c55e',
  negative: '#ef4444',
};

export const $customColors = atom<CustomThemeColors>(defaultCustomColors);

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
  if (saved && ['bloomberg', 'modern', 'dashboard', 'system', 'custom'].includes(saved)) {
    return saved;
  }
  return 'system'; // Default to system preference
};

function getInitialCustomColors(): CustomThemeColors {
  if (typeof window === 'undefined') return defaultCustomColors;
  const saved = localStorage.getItem('customThemeColors');
  if (saved) {
    try {
      return { ...defaultCustomColors, ...JSON.parse(saved) };
    } catch {
      return defaultCustomColors;
    }
  }
  return defaultCustomColors;
}

export const $theme = atom<Theme>('system');
export const $resolvedTheme = atom<ResolvedTheme>('dashboard');

export function initTheme() {
  if (typeof window === 'undefined') return;

  // Load custom colors
  const customColors = getInitialCustomColors();
  $customColors.set(customColors);

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

function applyCustomColors(colors: CustomThemeColors) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-rgb', colors.accentRgb);
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--bg-elevated', colors.bgElevated);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--positive', colors.positive);
  root.style.setProperty('--negative', colors.negative);
}

function clearCustomColors() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const props = [
    '--accent', '--accent-rgb', '--bg-primary', '--bg-secondary', '--bg-tertiary',
    '--bg-elevated', '--text-primary', '--text-secondary', '--text-muted',
    '--border', '--positive', '--negative'
  ];
  props.forEach(prop => root.style.removeProperty(prop));
}

function applyTheme(resolved: ResolvedTheme) {
  $resolvedTheme.set(resolved);
  if (typeof window !== 'undefined') {
    if (resolved === 'custom') {
      document.documentElement.setAttribute('data-theme', 'custom');
      applyCustomColors($customColors.get());
    } else {
      clearCustomColors();
      document.documentElement.setAttribute('data-theme', resolved);
    }
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

export function setCustomColor(key: keyof CustomThemeColors, value: string) {
  const colors = { ...$customColors.get(), [key]: value };

  // Auto-calculate RGB for accent
  if (key === 'accent') {
    const rgb = hexToRgb(value);
    if (rgb) {
      colors.accentRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }
  }

  $customColors.set(colors);

  if (typeof window !== 'undefined') {
    localStorage.setItem('customThemeColors', JSON.stringify(colors));
    if ($theme.get() === 'custom') {
      applyCustomColors(colors);
    }
  }
}

export function resetCustomColors() {
  $customColors.set(defaultCustomColors);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('customThemeColors');
    if ($theme.get() === 'custom') {
      applyCustomColors(defaultCustomColors);
    }
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export const themeNames: Record<Theme, string> = {
  system: 'System',
  bloomberg: 'Bloomberg Terminal',
  modern: 'Modern Fintech',
  dashboard: 'Dashboard Dark',
  custom: 'Custom',
};
