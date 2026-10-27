'use client';

import { useEffect, useState } from 'react';
import type { PublicProfile } from '@portfolio/shared';
import { getTheme } from '@/lib/themes';

// The inside of the dashboard's preview frame (components/dashboard/Preview.tsx). It shows
// nothing of its own: the dashboard sends the profile being edited as a message, from the same
// origin only, and this page draws it with the real theme. Like the old inline preview, its content
// cannot be clicked or focused. The route is guarded like the rest of /dashboard by src/proxy.ts.
export default function PreviewFramePage() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    // The frame is drawn shrunk, so a scrollbar in it would look like a stray hairline. It still
    // scrolls with the wheel and touch.
    document.documentElement.style.scrollbarWidth = 'none';
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === 'preview-profile') setProfile(e.data.profile as PublicProfile);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!profile) return null;
  const { Component: Theme } = getTheme(profile.theme);
  return (
    <div inert>
      <Theme profile={profile} idPrefix="preview-" />
    </div>
  );
}
