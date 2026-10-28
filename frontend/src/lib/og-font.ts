import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// The Devanagari font as data for ImageResponse (the icons and the share card), which cannot use
// next/font. The file is the same face the site uses (Noto Serif Devanagari Bold, SIL OFL).
// ImageResponse does not reorder Devanagari vowel signs, so text is given in visual order:
// "पिर" for "परि" (the i-matra is drawn before the letter it belongs to).
export const loadDevanagariFont = () =>
  readFile(join(process.cwd(), 'src/app/fonts/NotoSerifDevanagari-Bold.ttf'));
