import type { Metadata } from 'next';
import Link from 'next/link';
import { AppTestimonials } from '@/components/auth/AppTestimonials';
import { Faq } from '@/components/landing/Faq';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Themes } from '@/components/landing/Themes';
import { buttonStyles } from '@/components/ui';

const TITLE = 'Portfolio Generator: build and share your portfolio page';
const DESCRIPTION =
  'Upload your resume or fill in your details, choose a theme, and publish a portfolio page with its own link.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Portfolio Generator',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

// Server-rendered and static: the only script on the page is the scrolling quotes strip.
export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Themes />
        <Features />
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <AppTestimonials />
        </div>
        <Faq />
        <section aria-labelledby="cta-heading" className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-3xl rounded-card bg-accent-soft p-card-lg text-center">
            <h2 id="cta-heading" className="type-page">
              Ready to build yours?
            </h2>
            <p className="mt-2 text-muted">
              Create an account and start with your resume or from scratch.
            </p>
            <Link href="/register" className={`${buttonStyles({ variant: 'primary' })} mt-6`}>
              Create your portfolio
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
