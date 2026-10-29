'use client';

import { useEffect } from 'react';

// Puts the page's language and direction on <html> too (the root layout is shared by every page, so
// the server cannot know them there). The wrapper element carries them in the server HTML already.
export function HtmlLang({ lang, dir }: { lang: string; dir: 'ltr' | 'rtl' }) {
  useEffect(() => {
    const html = document.documentElement;
    const before = { lang: html.lang, dir: html.dir };
    html.lang = lang;
    html.dir = dir;
    return () => {
      html.lang = before.lang;
      html.dir = before.dir;
    };
  }, [lang, dir]);
  return null;
}
