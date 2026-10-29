import { createTranslator } from 'next-intl';
import { DEFAULT_LOCALE, isLocaleCode } from '@parichay/shared';
import ar from './messages/ar.json';
import bn from './messages/bn.json';
import de from './messages/de.json';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';
import gu from './messages/gu.json';
import hi from './messages/hi.json';
import mr from './messages/mr.json';
import pa from './messages/pa.json';
import pt from './messages/pt.json';
import ta from './messages/ta.json';
import te from './messages/te.json';
import ur from './messages/ur.json';

// The interface text of the public pages (section headings, buttons, the form for testimonials), one
// file per language. English is the master: a language that lacks a key shows the English text, so
// a missing string never shows as a key. The owner's own content is not in these files: that is
// the Translation table. Which files were written by a machine is listed in docs/i18n.md.

export type Ui = typeof en;
type Messages = Record<string, unknown>;

const FILES: Record<string, Messages> = { en, hi, te, ta, bn, mr, gu, pa, ur, es, fr, de, pt, ar };

const isObject = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// `base` with every string that `over` has put over it, at any depth.
function overlay(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = out[key];
    if (isObject(current) && isObject(value)) out[key] = overlay(current, value);
    else if (typeof value === 'string' && value.trim()) out[key] = value;
  }
  return out;
}

const cached = new Map<string, Ui>();

// All the strings for a language, as plain data (it can be passed to client components).
export function uiFor(locale: string): Ui {
  const code = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  let ui = cached.get(code);
  if (!ui) {
    ui = overlay(en, FILES[code] ?? {}) as Ui;
    cached.set(code, ui);
  }
  return ui;
}

// Fills the {placeholders} of a string, for the ones that are filled in at render time.
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => String(values[key] ?? whole));

// ICU messages (plurals), for the language.
export function translatorFor(locale: string) {
  const code = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  const t = createTranslator({
    locale: code,
    messages: uiFor(code) as never,
    onError: () => {},
    getMessageFallback: ({ key }) => key,
  }) as unknown as (key: string, values?: Record<string, string | number>) => string;
  return t;
}

// The locale for Intl: Latin digits in every language, so years and numbers read the same as the
// rest of the page (names, companies and dates in the owner's text use them).
export const intlLocale = (locale: string) =>
  `${isLocaleCode(locale) ? locale : DEFAULT_LOCALE}-u-nu-latn`;

// The path of a portfolio's page in a language: the default language lives at /<slug>, the others at
// /<slug>/<locale>.
export const pagePath = (slug: string, locale: string, defaultLocale: string) =>
  !locale || locale === defaultLocale ? `/${slug}` : `/${slug}/${locale}`;
