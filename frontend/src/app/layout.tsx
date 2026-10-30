import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import './globals.css';

// The app's two faces: Hanken Grotesk for text and Fraunces for headings. The CSS variables are
// picked up by --font-sans and --font-display in globals.css.
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  // Base for the absolute URLs in Open Graph and canonical tags.
  metadataBase: new URL(SITE_URL),
  title: { default: 'Parichay', template: '%s | Parichay' },
  description: 'Build and publish your portfolio page.',
};

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#fbf7f0' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the public pages put the visitor's reading preferences (data-read-*)
    // on <html> before React starts, and HtmlLang sets its lang and dir.
    <html lang="en" className={`${body.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="theme-root brand min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
