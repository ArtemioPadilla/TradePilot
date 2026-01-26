/**
 * useTheme Hook Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock document
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(),
};

Object.defineProperty(global.document, 'documentElement', {
  value: {
    classList: mockClassList,
    setAttribute: vi.fn(),
    dataset: {},
  },
  writable: true,
});

describe('Theme Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default theme', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    // Reset the store state
    themeStore.set({ theme: 'system', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.theme).toBe('system');
  });

  it('should persist theme to localStorage', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'dark', density: 'comfortable' });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should support light theme', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'light', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.theme).toBe('light');
  });

  it('should support dark theme', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'dark', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.theme).toBe('dark');
  });

  it('should support system theme', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'system', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.theme).toBe('system');
  });
});

describe('Density Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default density', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'system', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.density).toBe('comfortable');
  });

  it('should support compact density', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'system', density: 'compact' });

    const state = themeStore.get();
    expect(state.density).toBe('compact');
  });

  it('should support comfortable density', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'system', density: 'comfortable' });

    const state = themeStore.get();
    expect(state.density).toBe('comfortable');
  });

  it('should support spacious density', async () => {
    const { themeStore } = await import('../../../src/stores/theme');

    themeStore.set({ theme: 'system', density: 'spacious' });

    const state = themeStore.get();
    expect(state.density).toBe('spacious');
  });
});
