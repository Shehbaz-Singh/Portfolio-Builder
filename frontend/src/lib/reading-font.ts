import { Atkinson_Hyperlegible } from 'next/font/google';

// Atkinson Hyperlegible, for the "dyslexia-friendly" reading option. SIL Open Font License 1.1,
// made by the Braille Institute. preload is off and the file is a separate download per subset
// (unicode-range), so a visitor who never picks it never downloads it: the browser fetches a face
// only once text is drawn in it. It has no Indic or Arabic letters; the script's own font follows it
// in the stack (see app/reading-prefs.css), so those scripts keep their proper font.
export const atkinson = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-atkinson',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
