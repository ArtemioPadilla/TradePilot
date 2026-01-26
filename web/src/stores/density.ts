import { atom } from 'nanostores';

export type Density = 'compact' | 'comfortable' | 'spacious';

export const densityValues: Record<Density, number> = {
  compact: 0.75,
  comfortable: 1,
  spacious: 1.25,
};

export const densityNames: Record<Density, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

export const densityDescriptions: Record<Density, string> = {
  compact: 'Denser layout with reduced spacing',
  comfortable: 'Balanced spacing for everyday use',
  spacious: 'More breathing room between elements',
};

const getInitialDensity = (): Density => {
  if (typeof window === 'undefined') return 'comfortable';
  const saved = localStorage.getItem('density') as Density;
  if (saved && densityValues[saved]) {
    return saved;
  }
  return 'comfortable';
};

export const $density = atom<Density>('comfortable');

export function initDensity() {
  if (typeof window === 'undefined') return;
  const saved = getInitialDensity();
  setDensity(saved);
}

export function setDensity(density: Density) {
  $density.set(density);
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty('--spacing-density', String(densityValues[density]));
    localStorage.setItem('density', density);
  }
}
