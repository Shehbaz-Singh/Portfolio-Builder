import { DEFAULT_ACCENT, accentColorSchema } from '@portfolio/shared';

// The page background of the built-in theme (the --bg value in globals.css). Accent colors are
// checked against it. A theme with another background would pass its own value instead.
export const PAGE_BACKGROUND = '#ffffff';
export const MIN_CONTRAST = 4.5; // WCAG AA for normal text

// Offered as one-click choices. All of them are readable on a white page.
export const ACCENT_PRESETS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Orange', hex: '#c2410c' },
  { name: 'Green', hex: '#15803d' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Slate', hex: '#334155' },
] as const;

// The value as clean lowercase #rrggbb, or null if it is anything else. Only a value that has
// been through this may reach a style attribute or the color math below.
export function normalizeHex(value: unknown): string | null {
  const result = accentColorSchema.safeParse(value);
  return result.success ? result.data : null;
}

// WCAG relative luminance of a #RRGGBB color.
function luminance(hex: string): number {
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Black or white, whichever reads better on this color (for text placed on the accent).
export const readableTextOn = (hex: string) =>
  contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff') ? '#000000' : '#ffffff';

// The variables a theme wrapper sets for the accent. An invalid value falls back to the default
// instead of reaching the page.
export function accentVars(hex: string | null | undefined): Record<string, string> {
  const accent = normalizeHex(hex) ?? DEFAULT_ACCENT;
  return { '--accent': accent, '--on-accent': readableTextOn(accent) };
}
