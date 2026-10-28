import Link from 'next/link';
import { devanagari } from '@/lib/fonts';
import { buttonStyles } from '../ui';
import { FEATURED_SAMPLE_SLUG } from '@/lib/landing-sample';
import { ThemeExplorer } from './ThemeExplorer';

// The first screen: what it is, two ways in, and the product itself, large. The text rises in
// once (not for people who ask for less motion).
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-5 pt-14 pb-16 sm:px-8 lg:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="landing-rise mx-auto max-w-3xl text-center">
          <h1 id="hero-heading" className="type-hero text-balance sm:text-5xl lg:text-6xl">
            Introduce yourself <span className="text-accent-fg">properly.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-balance text-muted sm:text-xl">
            Upload your resume and get a polished portfolio page in minutes. Pick a look, add your
            projects, and share one link that’s yours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className={`${buttonStyles({ variant: 'primary' })} px-6 py-3 text-base`}
            >
              Create your Parichay
            </Link>
            <Link
              href={`/${FEATURED_SAMPLE_SLUG}`}
              className={`${buttonStyles({ variant: 'secondary' })} px-6 py-3 text-base`}
            >
              See an example
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">
            Parichay (
            <span lang="hi" className={devanagari.className}>
              परिचय
            </span>
            ) means “introduction” in Hindi.
          </p>
        </div>

        <div
          className="landing-rise mt-12 lg:mt-16"
          style={{ '--delay': '150ms' } as React.CSSProperties}
        >
          <ThemeExplorer idPrefix="hero" />
        </div>
      </div>
    </section>
  );
}
