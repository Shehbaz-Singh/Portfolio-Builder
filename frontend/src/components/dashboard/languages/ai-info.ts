'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client-api';

// The AI service that writes translation suggestions, as the API names it from its own
// configuration (null: switched off). The same source the privacy page reads.
let cached: Promise<string | null> | null = null;

const load = () =>
  (cached ??= api<{ aiProvider?: string | null }>('/public/_info', { redirectOn401: false }).then(
    (info) => info.aiProvider ?? null,
    () => {
      cached = null; // try again next time
      return null;
    },
  ));

export function useAiProvider(): { provider: string | null; ready: boolean } {
  const [state, setState] = useState<{ provider: string | null; ready: boolean }>({
    provider: null,
    ready: false,
  });
  useEffect(() => {
    let live = true;
    void load().then((provider) => live && setState({ provider, ready: true }));
    return () => {
      live = false;
    };
  }, []);
  return state;
}
