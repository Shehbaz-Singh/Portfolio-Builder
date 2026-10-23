import type { ReactElement } from 'react';
import type { PublicProfile } from '@portfolio/shared';

// Every theme is a component that receives the whole public profile and renders the page.
// To add a theme: create components/themes/<Name>Theme.tsx and register it in ./index.ts.
export interface ThemeProps {
  profile: PublicProfile;
}

export type ThemeComponent = (props: ThemeProps) => ReactElement;
