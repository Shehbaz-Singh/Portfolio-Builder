import MinimalTheme from './MinimalTheme';
import type { ThemeComponent } from './types';

interface ThemeEntry {
  label: string;
  description: string;
  Component: ThemeComponent;
}

// The keys are the values stored in profile.theme.
const themes: Record<string, ThemeEntry> = {
  minimal: {
    label: 'Minimal',
    description: "A clean single column. Follows the visitor's light or dark setting.",
    Component: MinimalTheme,
  },
};

export const DEFAULT_THEME = 'minimal';

// What the theme picker offers, in registry order.
export const THEME_OPTIONS = Object.entries(themes).map(([id, { label, description }]) => ({
  id,
  label,
  description,
}));

export const isKnownTheme = (name: string) => Object.hasOwn(themes, name);

// An unknown or retired theme name falls back to the default instead of breaking the page.
export function getTheme(name: string): ThemeComponent {
  return (isKnownTheme(name) ? themes[name] : themes[DEFAULT_THEME]).Component;
}
