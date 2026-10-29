import { pagePath } from '@/lib/i18n';
import type { PublicProfile } from '@parichay/shared';
import type { LanguageLink } from '@/components/portfolio/LanguageSwitcher';

// The language links of a page: the default language first, then the extra ones that are ready.
// `suffix` is the rest of the path ("/writing"), so the switcher stays on the same page.
export function languageLinks(profile: PublicProfile, suffix = ''): LanguageLink[] {
  const codes = [profile.defaultLocale, ...profile.locales];
  return codes.map((code) => ({
    code,
    href: `${pagePath(profile.slug, code, profile.defaultLocale)}${suffix}`,
  }));
}

// <link rel="alternate" hreflang>: every language of the page, and x-default (the default language).
export function alternateLanguages(profile: PublicProfile, suffix = ''): Record<string, string> {
  const links = languageLinks(profile, suffix);
  const out: Record<string, string> = Object.fromEntries(links.map((l) => [l.code, l.href]));
  out['x-default'] = links[0].href;
  return out;
}
