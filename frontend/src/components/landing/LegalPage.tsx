import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '../ui';
import { Footer } from './Footer';

// The shell of the privacy and terms pages. Their text is a placeholder until real documents
// exist, and says so on the page.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to home
        </Link>
        <h1 className="type-page mt-6">{title}</h1>
        <Card tone="warning" padding="sm" className="mt-4 text-sm">
          This is a placeholder. It is not a legal document yet.
        </Card>
        <div className="mt-6 space-y-4 text-muted">{children}</div>
      </main>
      <Footer />
    </>
  );
}
