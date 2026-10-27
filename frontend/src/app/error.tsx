'use client';

import Link from 'next/link';
import { ErrorPage } from '@/components/ErrorPage';
import { Button, buttonStyles } from '@/components/ui';

// Anything unexpected that breaks a page. Nothing the person saved is lost by this.
export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPage
      title="Something went wrong"
      message="An unexpected error stopped this page from loading. Everything you saved earlier is safe. Try again, and if it keeps happening, come back in a little while."
    >
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
      <Link href="/" className={buttonStyles()}>
        Back to home
      </Link>
    </ErrorPage>
  );
}
