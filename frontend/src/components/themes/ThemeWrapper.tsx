import type { CSSProperties, ReactNode } from 'react';
import type { PublicProfile } from '@portfolio/shared';
import { accentVars } from '@/lib/color';

// The root element of every theme. `theme-root` defines the color variables (globals.css), and
// the profile's accent is set inline here, so the server renders the right colors in the first
// HTML and nothing changes color after the page loads. A theme that wants other base colors adds
// a class that redefines the variables; the accent keeps working.
export function ThemeWrapper({
  profile,
  className = '',
  children,
}: {
  profile: Pick<PublicProfile, 'accentColor'>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`theme-root min-h-screen ${className}`}
      style={accentVars(profile.accentColor) as CSSProperties}
    >
      {children}
    </div>
  );
}
