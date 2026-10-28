import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL_VERSION } from '@parichay/shared';

import { Footer } from './Footer';

// The shell of the privacy and terms pages: a title, when it was last updated, a table of contents
// and the sections.

// "28 October 2026", from the version string (which is a date).
const updated = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(LEGAL_VERSION));

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <main id="main" className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to home
        </Link>
        <h1 className="type-page mt-6">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          Last updated <time dateTime={LEGAL_VERSION}>{updated}</time> · Version {LEGAL_VERSION}
        </p>

        <div className="mt-8 text-pretty text-ink">{intro}</div>

        <nav aria-labelledby="toc-heading" className="mt-8 rounded-card border border-line p-card">
          <h2 id="toc-heading" className="text-sm font-semibold">
            On this page
          </h2>
          <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-accent-fg underline-offset-2 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`} className="type-section scroll-mt-6">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-pretty [&_a]:text-accent-fg [&_a]:underline [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:ps-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
