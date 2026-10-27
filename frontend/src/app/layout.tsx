import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import './globals.css';

// The app's one sans font. The CSS variable is picked up by --font-sans in globals.css.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  // Base for the absolute URLs in Open Graph and canonical tags.
  metadataBase: new URL(SITE_URL),
  title: { default: 'Portfolio Generator', template: '%s | Portfolio Generator' },
  description: 'Build and publish your portfolio page.',
};

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#ffffff' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="theme-root min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
