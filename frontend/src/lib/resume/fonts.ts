import path from 'node:path';
import { Font } from '@react-pdf/renderer';

// The fonts of the resume PDF, read from disk (they ship with the route: see
// outputFileTracingIncludes in next.config.ts). Each portfolio theme has its own pair, the same
// faces the page uses, so the resume looks like the page. Noto Sans Devanagari covers Hindi and
// other Devanagari text in any theme (see rich() in parts.tsx).

const DIR = path.join(process.cwd(), 'src/fonts/pdf');
const file = (name: string) => path.join(DIR, name);

type Face = { file: string; weight?: number; italic?: boolean };

function register(family: string, faces: Face[]) {
  Font.register({
    family,
    fonts: faces.map((face) => ({
      src: file(face.file),
      fontWeight: face.weight ?? 400,
      ...(face.italic && { fontStyle: 'italic' as const }),
    })),
  });
}

register('Newsreader', [
  { file: 'Newsreader-Regular.ttf' },
  { file: 'Newsreader-Medium.ttf', weight: 500 },
  { file: 'Newsreader-Italic.ttf', italic: true },
]);
register('Hanken Grotesk', [
  { file: 'HankenGrotesk-Regular.ttf' },
  { file: 'HankenGrotesk-Bold.ttf', weight: 700 },
]);
register('Sora', [
  { file: 'Sora-SemiBold.ttf', weight: 600 },
  { file: 'Sora-Bold.ttf', weight: 700 },
]);
register('Plus Jakarta Sans', [
  { file: 'PlusJakartaSans-400.woff' },
  { file: 'PlusJakartaSans-700.woff', weight: 700 },
]);
register('Fredoka', [
  { file: 'Fredoka-Medium.ttf', weight: 500 },
  { file: 'Fredoka-Bold.ttf', weight: 700 },
]);
register('Nunito Sans', [
  { file: 'NunitoSans-Regular.ttf' },
  { file: 'NunitoSans-Bold.ttf', weight: 700 },
]);
register('Source Serif 4', [
  { file: 'SourceSerif4-SemiBold.ttf', weight: 600 },
  { file: 'SourceSerif4-Bold.ttf', weight: 700 },
]);
register('Source Sans 3', [
  { file: 'SourceSans3-Regular.ttf' },
  { file: 'SourceSans3-Bold.ttf', weight: 700 },
]);
register('Bricolage Grotesque', [
  { file: 'Bricolage-Regular.ttf' },
  { file: 'Bricolage-Bold.ttf', weight: 700 },
  { file: 'Bricolage-ExtraBold.ttf', weight: 800 },
]);
register('Space Mono', [
  { file: 'SpaceMono-Regular.ttf' },
  { file: 'SpaceMono-Bold.ttf', weight: 700 },
]);
register('Noto Sans Devanagari', [
  { file: 'NotoSansDevanagari-Regular.ttf' },
  { file: 'NotoSansDevanagari-Bold.ttf', weight: 700 },
]);

// Never split a word with a hyphen: it would break search and parsing, and Hindi words must not break.
Font.registerHyphenationCallback((word) => [word]);

export const DEVANAGARI = 'Noto Sans Devanagari';
