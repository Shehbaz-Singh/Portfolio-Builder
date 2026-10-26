import { DEFAULT_THEME, THEME_KEYS, type ThemeKey } from '@portfolio/shared';
import ClassicTheme from '@/components/themes/ClassicTheme';
import CreativeTheme from '@/components/themes/CreativeTheme';
import DarkTheme from '@/components/themes/DarkTheme';
import MinimalTheme from '@/components/themes/MinimalTheme';
import type { ThemeComponent } from '@/components/themes/types';
import { PALETTES } from './palettes';

export { DEFAULT_THEME };

export interface ThemeEntry {
  key: ThemeKey; // the value stored in profile.theme
  name: string;
  description: string;
  // Light or dark and the page background, from lib/palettes.ts. The accent picker checks contrast
  // against them and the page tells the browser about them.
  scheme: 'light' | 'dark';
  background: string;
  Component: ThemeComponent;
}

// Typed as a Record over the shared key list: the compiler fails here if a theme key that the API
// accepts has no entry, or an entry has no key. Every component gets the same props (the whole
// public profile) and fetches nothing.
const entries: Record<ThemeKey, Omit<ThemeEntry, 'key' | 'scheme' | 'background'>> = {
  minimal: {
    name: 'Minimal',
    description: 'A clean single column.',
    Component: MinimalTheme,
  },
  dark: {
    name: 'Dark',
    description: 'Light text on a dark background, whatever the visitor’s system setting.',
    Component: DarkTheme,
  },
  creative: {
    name: 'Creative',
    description: 'Bold type, a header in your accent color and an expressive layout.',
    Component: CreativeTheme,
  },
  classic: {
    name: 'Classic',
    description: 'A traditional resume layout with serif headings.',
    Component: ClassicTheme,
  },
};

// In the order the picker shows them.
export const THEME_LIST: ThemeEntry[] = THEME_KEYS.map((key) => ({
  key,
  scheme: PALETTES[key].scheme,
  background: PALETTES[key].background,
  ...entries[key],
}));

// An unknown or retired theme name falls back to the default instead of breaking the page.
export function getTheme(key: string): ThemeEntry {
  return THEME_LIST.find((theme) => theme.key === key) ?? THEME_LIST[0];
}
