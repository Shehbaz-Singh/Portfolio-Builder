import { Noto_Serif_Devanagari } from 'next/font/google';

// The Devanagari face for the wordmark and the Hindi word on the landing page. A serif with a
// matching stroke contrast to Fraunces (the display font), at the one weight the wordmark uses (bold: Devanagari strokes are thinner than Latin at the same weight),
// and only the Devanagari glyphs: the Latin part of the wordmark is set in Fraunces.
export const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['700'],
  display: 'swap',
});
