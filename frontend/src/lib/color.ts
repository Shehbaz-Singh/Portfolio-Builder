import { DEFAULT_ACCENT, accentColorSchema } from '@parichay/shared';
import type { Palette } from './palettes';

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

const channels = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

// WCAG relative luminance of a #RRGGBB color.
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// `share` of `a` mixed with the rest of `b` (what CSS color-mix(in srgb) does).
export function mix(a: string, b: string, share: number): string {
  const [ca, cb] = [channels(a), channels(b)];
  return (
    '#' +
    ca
      .map((value, i) => Math.round(value * share + cb[i] * (1 - share)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')
  );
}

// Black or white, whichever reads better on this color (for text placed on the accent). Either
// one reaches at least 4.58:1, so text on the accent is always readable.
export const readableTextOn = (hex: string) =>
  contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff') ? '#000000' : '#ffffff';

// The accent as the color of text (links, tags) on a theme's page. It has to be readable on the
// page itself and on the tinted background tags sit on (--accent-soft: 12% accent over the page).
// If the accent is not, it is moved toward the theme's text color a step at a time until it is,
// so a pale yellow becomes a dark olive and the default blue on a dark page becomes a lighter
// blue. The accent itself is still used for fills (buttons, the header) where it is not text.
export function readableAccent(accent: string, { background, text }: Palette): string {
  const soft = mix(accent, background, 0.12);
  const readable = (color: string) =>
    contrastRatio(color, background) >= MIN_CONTRAST && contrastRatio(color, soft) >= MIN_CONTRAST;
  for (let towardText = 0; towardText < 1; towardText += 0.05) {
    const color = mix(text, accent, towardText);
    if (readable(color)) return color;
  }
  return text;
}

// The variables a theme wrapper sets for the accent. An invalid value falls back to the default
// instead of reaching the page.
export function accentVars(
  hex: string | null | undefined,
  palette: Palette,
): Record<string, string> {
  const accent = normalizeHex(hex) ?? DEFAULT_ACCENT;
  return {
    '--accent': accent,
    '--on-accent': readableTextOn(accent),
    '--accent-fg': readableAccent(accent, palette),
  };
}
