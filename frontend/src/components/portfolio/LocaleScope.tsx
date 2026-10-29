import type { ReactNode } from 'react';
import { languageOf } from '@parichay/shared';
import { localeFontClass } from '@/lib/locale-fonts';
import { HtmlLang } from './HtmlLang';
import { LanguageSwitcher, type LanguageLink } from './LanguageSwitcher';

// Everything on a portfolio page in one language: its lang and direction (so screen readers, hyphenation
// and the browser's text handling are right, and RTL layouts mirror through logical CSS properties),
// the script's font, and, when the profile has other languages, the links to them.
export async function LocaleScope({
  locale,
  links,
  label,
  children,
}: {
  locale: string;
  links: LanguageLink[]; // empty: no switcher
  label: string; // "Language"
  children: ReactNode;
}) {
  const language = languageOf(locale);
  const fontClass = await localeFontClass(locale);
  return (
    <div
      lang={language.code}
      dir={language.dir}
      data-script={language.script}
      className={fontClass}
    >
      <HtmlLang lang={language.code} dir={language.dir} />
      {links.length > 1 && <LanguageSwitcher links={links} current={language.code} label={label} />}
      {children}
    </div>
  );
}
