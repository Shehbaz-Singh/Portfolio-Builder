'use client';

import type { ReactNode } from 'react';
import { ApiError } from '@/lib/client-api';
import { useSlow } from '@/lib/hooks';
import { Button } from '../ui';

// Full-page states shared by the editor and the settings page.

function Centered({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      {children}
    </main>
  );
}

export function Loading({ label }: { label: string }) {
  const slow = useSlow(true);
  return (
    <Centered>
      <div
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-line border-t-accent"
      />
      <p role="status" className="font-medium">
        {slow ? 'Waking up the server…' : label}
      </p>
      {slow && (
        <p className="max-w-sm text-sm text-muted">
          The server sleeps when nobody has used it for a while. This can take up to a minute the
          first time, and then it is fast again.
        </p>
      )}
    </Centered>
  );
}

export function LoadFailed({
  title,
  error,
  retry,
}: {
  title: string;
  error: unknown;
  retry: () => void;
}) {
  return (
    <Centered>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="max-w-sm text-muted">
        <p>{error instanceof ApiError ? error.message : 'Something went wrong.'}</p>
        <p>Everything you saved earlier is safe.</p>
      </div>
      <Button variant="primary" onClick={retry}>
        Try again
      </Button>
    </Centered>
  );
}
