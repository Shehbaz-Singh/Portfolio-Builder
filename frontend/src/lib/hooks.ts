'use client';

import { useCallback, useEffect, useState } from 'react';

// True once `active` has been true for `ms`. Drives the "the server is waking up" message:
// fast responses never show it, slow ones explain the wait.
export function useSlow(active: boolean, ms = 4000): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), ms);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, ms]);
  return slow;
}

export type LoadState<T> =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T };

// Runs `load` on mount and again whenever retry() is called.
export function useLoad<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      (error) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      },
    );
    return () => controller.abort();
    // `load` is expected to be stable (defined outside the component).
  }, [load, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
