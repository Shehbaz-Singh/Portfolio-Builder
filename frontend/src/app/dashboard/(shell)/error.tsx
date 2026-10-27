'use client';

import { ErrorPage } from '@/components/ErrorPage';
import { Button } from '@/components/ui';

// A page inside the dashboard broke. The sidebar and top bar stay, so the other pages still work.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPage
      main={false}
      title="This page hit a problem"
      message="Everything you saved earlier is safe. Try again, or use the menu to open another page."
    >
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </ErrorPage>
  );
}
