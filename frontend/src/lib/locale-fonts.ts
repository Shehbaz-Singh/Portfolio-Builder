import { languageOf, type Script } from '@parichay/shared';

// The font of a language's script, loaded only when a page in that language renders (each file
// calls next/font once, and only an imported file's CSS is sent). Latin needs none: the themes bring
// their own. Urdu uses Nastaliq, its traditional style; Arabic uses Naskh.
const loaders: Record<Exclude<Script, 'latin'>, () => Promise<{ font: { variable: string } }>> = {
  devanagari: () => import('./locale-fonts/devanagari'),
  telugu: () => import('./locale-fonts/telugu'),
  tamil: () => import('./locale-fonts/tamil'),
  bengali: () => import('./locale-fonts/bengali'),
  gujarati: () => import('./locale-fonts/gujarati'),
  gurmukhi: () => import('./locale-fonts/gurmukhi'),
  arabic: () => import('./locale-fonts/arabic'),
  nastaliq: () => import('./locale-fonts/nastaliq'),
};

export async function localeFontClass(locale: string): Promise<string> {
  const { script } = languageOf(locale);
  return script === 'latin' ? '' : (await loaders[script]()).font.variable;
}
