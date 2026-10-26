import { DEFAULT_ACCENT, accentColorSchema } from '@portfolio/shared';

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

// How the accent reads as text on a theme's background. Light themes use it as it is. Dark
// themes lighten it by mixing in 40% white, which is what `--accent-fg` does in globals.css.
function mixWithWhite(hex: string, share: number): string {
  const channel = (start: number) =>
    Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - share) + 255 * share)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

export const accentAsText = (hex: string, scheme: 'light' | 'dark') =>
  scheme === 'dark' ? mixWithWhite(hex, 0.4) : hex;

// Contrast of the accent, used as text, against a theme's page background.
export const accentContrast = (
  hex: string,
  theme: { background: string; scheme: 'light' | 'dark' },
) => contrastRatio(accentAsText(hex, theme.scheme), theme.background);

// The variables a theme wrapper sets for the accent. An invalid value falls back to the default
// instead of reaching the page.
export function accentVars(hex: string | null | undefined): Record<string, string> {
  const accent = normalizeHex(hex) ?? DEFAULT_ACCENT;
  return { '--accent': accent, '--on-accent': readableTextOn(accent) };
}
