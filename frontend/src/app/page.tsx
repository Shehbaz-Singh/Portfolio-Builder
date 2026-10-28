import type { Metadata } from 'next';
import Link from 'next/link';
import { DataStrip } from '@/components/landing/DataStrip';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Themes } from '@/components/landing/Themes';
import { buttonStyles } from '@/components/ui';
import { SITE_URL } from '@/lib/config';

const TITLE = 'Parichay: introduce yourself properly';
const DESCRIPTION =
  'Upload your resume and get a polished portfolio page in minutes. Pick a look, add your projects, and share one link that’s yours.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Parichay',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

// Who we are and what the site is, for search engines. Nothing here that the page does not say.
const STRUCTURED_DATA = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Parichay',
    url: SITE_URL,
    description: DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Parichay',
    url: SITE_URL,
    description: DESCRIPTION,
    inLanguage: 'en',
  },
]);

// Server-rendered and static. The one script that runs is the preview in the hero and in the
// themes section, which loads its theme code after the page has arrived.
export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Themes />
        <Features />
        <DataStrip />
        <Faq />
        <section aria-labelledby="cta-heading" className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-3xl rounded-card bg-accent-soft p-8 text-center sm:p-14">
            <h2 id="cta-heading" className="type-page text-3xl text-balance sm:text-4xl">
              Ready to introduce yourself?
            </h2>
            <p className="mt-3 text-lg text-muted">
              Start with your resume or from scratch. It takes a few minutes.
            </p>
            <Link
              href="/register"
              className={`${buttonStyles({ variant: 'primary' })} mt-8 px-6 py-3 text-base`}
            >
              Create your Parichay
            </Link>
            <p className="mt-4 text-xs text-muted">
              By creating an account you agree to the{' '}
              <Link href="/terms" className="underline hover:text-ink">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-ink">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
