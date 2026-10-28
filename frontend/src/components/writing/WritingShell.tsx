import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PublicProfile } from '@portfolio/shared';
import { loadThemeFonts } from '@/lib/theme-loader';
import { getTheme } from '@/lib/themes';
import { ThemeWrapper } from '../themes/ThemeWrapper';

// The frame of the Writing pages (the list and a single post): the owner's theme colors and accent,
// a way back to their portfolio, and the content. It is the reading layout, not a full theme: the
// five themes only draw the portfolio page itself.
export async function WritingShell({
  profile,
  children,
}: {
  profile: PublicProfile;
  children: ReactNode;
}) {
  const theme = getTheme(profile.theme).key;
  const fonts = await loadThemeFonts(theme);
  // `.wr-display` marks headings that use the theme's display face. Creative has none of its own (its
  // body font is the display font), so there it changes nothing.
  const display =
    theme === 'creative' ? '' : '[&_.wr-display]:font-(family-name:--font-theme-display)';
  return (
    <ThemeWrapper theme={theme} profile={profile} className={`${fonts} ${display}`}>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href={`/${profile.slug}`}
            className="min-w-0 truncate font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
          >
            {profile.fullName}
          </Link>
          <Link
            href={`/${profile.slug}/writing`}
            className="shrink-0 text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
          >
            All writing
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 py-10 text-ink sm:px-8 sm:py-14">
        {children}
      </main>
    </ThemeWrapper>
  );
}
