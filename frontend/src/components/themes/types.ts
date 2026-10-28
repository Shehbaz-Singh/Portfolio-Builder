import type { ReactElement } from 'react';
import type { PublicProfile } from '@parichay/shared';

// Every theme is a component that receives the whole public profile and draws the page. It never
// fetches anything: the profile arrives ready, and components/themes/blocks.ts turns it into the
// header and the sections to draw. To add a theme: create components/themes/<Name>Theme.tsx and
// register it in lib/themes.ts (and add its key to THEME_KEYS in the shared package).
export interface ThemeProps {
  profile: PublicProfile;
  // Put in front of the ids a theme creates, for the rare page that draws a profile twice.
  idPrefix?: string;
}

export type ThemeComponent = (props: ThemeProps) => ReactElement;
