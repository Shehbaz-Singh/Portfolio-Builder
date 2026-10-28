import { devanagari } from '@/lib/fonts';
import { cx } from './ui/cx';

// The product's wordmark: "परिchay", the Hindi "परि" and the Latin "chay" set as one word. Every
// place that shows the brand uses this component, so the real logo is a one-file change.
//
// Switch the script order for the whole site with WORDMARK_SCRIPT below, or per use with `script`:
//   'devanagari-first'  परिchay
//   'latin-first'       Pariचय
export type WordmarkScript = 'devanagari-first' | 'latin-first';
export const WORDMARK_SCRIPT: WordmarkScript = 'devanagari-first';

const PARTS = {
  'devanagari-first': [
    { text: 'परि', lang: 'hi' },
    { text: 'chay', lang: 'en' },
  ],
  'latin-first': [
    { text: 'Pari', lang: 'en' },
    { text: 'चय', lang: 'hi' },
  ],
} as const;

// Sizes are on the container (font-size), so the two scripts always scale together. The size
// balance between them is in .wordmark-hi (globals.css).
const VARIANTS = {
  header: 'text-[1.5rem]',
  footer: 'text-[1.375rem]',
  auth: 'text-[1.5rem]',
  hero: 'text-[clamp(2.75rem,9vw,4.5rem)]',
};

// `tone` is the background it sits on: light backgrounds get ink, dark ones get paper.
const TONES = { light: 'text-ink', dark: 'text-page' };

// Read out as the word "Parichay", never letter by letter: the label is on the whole mark and the
// pieces are hidden from assistive technology (they keep their lang for fonts and hyphenation).
export function Logo({
  variant = 'header',
  tone = 'light',
  script = WORDMARK_SCRIPT,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  tone?: keyof typeof TONES;
  script?: WordmarkScript;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Parichay"
      className={cx('wordmark', VARIANTS[variant], TONES[tone], className)}
    >
      {PARTS[script].map(({ text, lang }) => (
        <span
          key={text}
          aria-hidden="true"
          lang={lang}
          className={lang === 'hi' ? cx('wordmark-hi', devanagari.className) : 'wordmark-latin'}
        >
          {text}
        </span>
      ))}
    </span>
  );
}
