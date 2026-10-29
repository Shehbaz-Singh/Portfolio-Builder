'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// Mac and iPad use Cmd (⌘); everything else uses Ctrl. Read in the browser only: the server cannot
// know, so it renders the Ctrl form first and the hint changes right after loading on a Mac.
export const isMacPlatform = () => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? navigator.platform ?? '');
};

export const useIsMac = () => useSyncExternalStore(subscribe, isMacPlatform, () => false);
