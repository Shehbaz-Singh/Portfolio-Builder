import { Noto_Sans_Devanagari } from 'next/font/google';

// Only this script's glyphs (the browser falls back to the page font for Latin), and not preloaded:
// a page in another language does not download it.
export const font = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-script',
  display: 'swap',
  preload: false,
});
