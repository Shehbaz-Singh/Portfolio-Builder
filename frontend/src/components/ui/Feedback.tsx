'use client';

import { useSlow } from '@/lib/hooks';

// Shown while a request is slow, so a sleeping free-tier server does not look like a crash.
export function SlowNotice({ pending }: { pending: boolean }) {
  const slow = useSlow(pending);
  return (
    <p role="status" className="text-sm text-muted">
      {pending && slow
        ? 'Still working. The server wakes up after a quiet spell, which can take up to a minute.'
        : ''}
    </p>
  );
}

export function ErrorText({ children, id }: { children?: string; id?: string }) {
  return children ? (
    <p id={id} role="alert" className="text-sm text-danger">
      {children}
    </p>
  ) : null;
}
