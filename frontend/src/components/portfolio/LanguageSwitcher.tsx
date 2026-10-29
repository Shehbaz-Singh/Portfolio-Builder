import Link from 'next/link';
import { languageOf } from '@parichay/shared';

export interface LanguageLink {
  code: string;
  href: string;
}

// The languages of a portfolio, each named in its own script, as plain links: no cookie, no redirect
// by browser language, and the page you are on is marked with aria-current. It is a strip above the
// theme (the five themes have different headers), in the page's own colors so it reads the same on all.
export function LanguageSwitcher({
  links,
  current,
  label,
}: {
  links: LanguageLink[];
  current: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="brand border-b border-[#d8cdbd] bg-[#f4ede2] px-4 py-1.5 text-sm text-[#1f1a17]"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-x-1 gap-y-1">
        {links.map(({ code, href }) => {
          const language = languageOf(code);
          const active = code === current;
          return (
            <li key={code}>
              <Link
                href={href}
                lang={code}
                hrefLang={code}
                dir={language.dir}
                aria-current={active ? 'page' : undefined}
                className={`inline-block rounded px-2.5 py-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9e3d21] ${active ? 'bg-[#1f1a17] font-semibold text-[#fbf7f0]' : 'text-[#7f301a] underline underline-offset-2 hover:no-underline'}`}
              >
                {language.nativeName}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
