import MinimalTheme from './MinimalTheme';
import type { ThemeComponent } from './types';

// The keys are the values stored in profile.theme.
const themes: Record<string, ThemeComponent> = {
  minimal: MinimalTheme,
};

// An unknown or retired theme name falls back to the default instead of breaking the page.
export function getTheme(name: string): ThemeComponent {
  return themes[name] ?? MinimalTheme;
}
