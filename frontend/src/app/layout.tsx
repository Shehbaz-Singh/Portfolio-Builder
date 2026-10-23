import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  // Base for the absolute URLs in Open Graph and canonical tags.
  metadataBase: new URL(SITE_URL),
  title: 'Portfolio Generator',
  description: 'Build and publish your portfolio page.',
};

// Lets the browser draw form controls and scrollbars to match light or dark mode.
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
