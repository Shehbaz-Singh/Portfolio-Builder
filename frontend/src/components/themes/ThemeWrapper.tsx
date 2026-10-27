import type { CSSProperties, ReactNode } from 'react';
import type { PublicProfile, ThemeKey } from '@portfolio/shared';
import { accentVars } from '@/lib/color';
import { PALETTES } from '@/lib/palettes';

// The root element of every theme. `theme-root` defines the color variables (globals.css), and
// the profile's accent is set inline here, so the server renders the right colors in the first
// HTML and nothing changes color after the page loads. A theme that wants other base colors has a
// class (`theme-<key>`) that redefines the variables; the accent keeps working. The theme comes
// from the component, not the profile, because the dashboard draws every theme with one profile.
export function ThemeWrapper({
  theme,
  profile,
  className = '',
  vars,
  children,
}: {
  theme: ThemeKey;
  profile: Pick<PublicProfile, 'accentColor'>;
  className?: string; // the theme's font classes
  vars?: Record<string, string>; // extra CSS variables of the theme
  children: ReactNode;
}) {
  return (
    <div
      className={`theme-root min-h-screen overflow-x-clip theme-${theme} ${className}`}
      style={{ ...accentVars(profile.accentColor, PALETTES[theme]), ...vars } as CSSProperties}
    >
      {children}
    </div>
  );
}
