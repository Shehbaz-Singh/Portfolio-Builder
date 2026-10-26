import type { ThemeKey } from '@portfolio/shared';

// What the color math needs to know about each theme. The same values are the variables of
// the theme's class in globals.css (--bg and --text), so change them together.
export interface Palette {
  scheme: 'light' | 'dark';
  background: string;
  text: string;
}

// A Record over the shared key list, so a theme the API accepts cannot be missing here.
export const PALETTES: Record<ThemeKey, Palette> = {
  minimal: { scheme: 'light', background: '#ffffff', text: '#0f172a' },
  dark: { scheme: 'dark', background: '#0b1020', text: '#e8ecf5' },
  creative: { scheme: 'light', background: '#ffffff', text: '#09090b' },
  classic: { scheme: 'light', background: '#fdfcf8', text: '#1c1917' },
};
